//! Windows taskbar thumbnail toolbar (prev / play-pause / next on hover).
//! No-op on non-Windows targets.

#[cfg(windows)]
mod win {
    use std::sync::atomic::{AtomicU32, Ordering};

    use tauri::{AppHandle, Manager, Window};
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
    use windows::Win32::Graphics::Gdi::{
        CreateBitmap, CreateDIBSection, DeleteObject, BITMAPINFO, BITMAPINFOHEADER, BI_RGB,
        DIB_RGB_COLORS, HBITMAP,
    };
    use windows::Win32::System::Com::{CoCreateInstance, CLSCTX_INPROC_SERVER};
    use windows::Win32::UI::Shell::{
        DefSubclassProc, ITaskbarList3, RemoveWindowSubclass, SetWindowSubclass, TaskbarList,
        THBF_ENABLED, THBN_CLICKED, THB_FLAGS, THB_ICON, THB_TOOLTIP, THUMBBUTTON,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        CreateIconIndirect, DestroyIcon, PostMessageW, RegisterWindowMessageW, HICON, ICONINFO,
        WM_COMMAND, WM_NCDESTROY, WM_USER,
    };

    const SUBCLASS_ID: usize = 0xA7_E3_09;
    const BTN_PREV: u32 = 1001;
    const BTN_PLAY_PAUSE: u32 = 1002;
    const BTN_NEXT: u32 = 1003;
    const WM_USER_UPDATE_PLAYBACK: u32 = WM_USER + 40;

    pub const EVENT_PREV: &str = "media-prev";
    pub const EVENT_TOGGLE: &str = "media-toggle";
    pub const EVENT_NEXT: &str = "media-next";

    static TASKBAR_CREATED_MSG_ID: AtomicU32 = AtomicU32::new(0);

    struct TaskbarContext {
        app: AppHandle,
        taskbar: Option<ITaskbarList3>,
        buttons_added: bool,
        icon_prev: HICON,
        icon_play: HICON,
        icon_pause: HICON,
        icon_next: HICON,
        is_playing: bool,
    }

    fn wide(s: &str) -> Vec<u16> {
        s.encode_utf16().chain(std::iter::once(0)).collect()
    }

    fn set_tip(buf: &mut [u16; 260], s: &str) {
        for (i, cu) in s.encode_utf16().take(259).enumerate() {
            buf[i] = cu;
        }
        let end = s.encode_utf16().take(259).count();
        if end < 260 {
            buf[end] = 0;
        }
    }

    fn hwnd_from_window(window: &Window) -> Result<HWND, String> {
        let handle = window.hwnd().map_err(|e| e.to_string())?;
        // Tauri 1 uses windows 0.39 HWND(isize); convert for windows 0.58.
        Ok(HWND(handle.0 as *mut std::ffi::c_void))
    }

    #[derive(Clone, Copy)]
    enum Glyph {
        Prev,
        Play,
        Pause,
        Next,
    }

    fn paint_glyph(buf: &mut [u32], kind: Glyph) {
        // Clear transparent
        buf.fill(0);
        let put = |buf: &mut [u32], x: i32, y: i32| {
            if (0..16).contains(&x) && (0..16).contains(&y) {
                // Premultiplied white
                buf[(y * 16 + x) as usize] = 0xFFFF_FFFF;
            }
        };
        let fill_rect = |buf: &mut [u32], x0: i32, y0: i32, x1: i32, y1: i32| {
            for y in y0..y1 {
                for x in x0..x1 {
                    put(buf, x, y);
                }
            }
        };

        match kind {
            Glyph::Play => {
                for y in 3..13 {
                    let t = (y - 3) as f32 / 9.0;
                    let inset = ((1.0 - (2.0 * t - 1.0).abs()) * 7.0) as i32;
                    for x in 5..(5 + inset.max(1)) {
                        put(buf, x, y);
                    }
                }
            }
            Glyph::Pause => {
                fill_rect(buf, 4, 3, 7, 13);
                fill_rect(buf, 9, 3, 12, 13);
            }
            Glyph::Prev => {
                fill_rect(buf, 3, 3, 5, 13);
                for y in 3..13 {
                    let t = (y - 3) as f32 / 9.0;
                    let inset = ((1.0 - (2.0 * t - 1.0).abs()) * 6.0) as i32;
                    for x in (10 - inset.max(1))..10 {
                        put(buf, x, y);
                    }
                }
            }
            Glyph::Next => {
                for y in 3..13 {
                    let t = (y - 3) as f32 / 9.0;
                    let inset = ((1.0 - (2.0 * t - 1.0).abs()) * 6.0) as i32;
                    for x in 5..(5 + inset.max(1)) {
                        put(buf, x, y);
                    }
                }
                fill_rect(buf, 11, 3, 13, 13);
            }
        }
    }

    unsafe fn create_glyph_icon(kind: Glyph) -> HICON {
        let mut pixels = [0u32; 16 * 16];
        paint_glyph(&mut pixels, kind);

        let bmi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: 16,
                biHeight: -16,
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0 as u32,
                biSizeImage: 0,
                biXPelsPerMeter: 0,
                biYPelsPerMeter: 0,
                biClrUsed: 0,
                biClrImportant: 0,
            },
            bmiColors: [Default::default()],
        };

        let mut bits: *mut std::ffi::c_void = std::ptr::null_mut();
        let color = match CreateDIBSection(None, &bmi, DIB_RGB_COLORS, &mut bits, None, 0) {
            Ok(bmp) => bmp,
            Err(_) => HBITMAP::default(),
        };
        if !bits.is_null() {
            std::ptr::copy_nonoverlapping(pixels.as_ptr(), bits as *mut u32, pixels.len());
        }

        let mask = CreateBitmap(16, 16, 1, 1, None);
        let info = ICONINFO {
            fIcon: true.into(),
            xHotspot: 0,
            yHotspot: 0,
            hbmMask: mask,
            hbmColor: color,
        };
        let icon = CreateIconIndirect(&info).unwrap_or_default();
        let _ = DeleteObject(color);
        let _ = DeleteObject(mask);
        icon
    }

    unsafe fn add_buttons(hwnd: HWND, ctx: &TaskbarContext) -> windows::core::Result<ITaskbarList3> {
        let taskbar: ITaskbarList3 = CoCreateInstance(&TaskbarList, None, CLSCTX_INPROC_SERVER)?;
        taskbar.HrInit()?;

        let mut buttons = [
            THUMBBUTTON {
                dwMask: THB_ICON | THB_TOOLTIP | THB_FLAGS,
                iId: BTN_PREV,
                hIcon: ctx.icon_prev,
                szTip: [0; 260],
                dwFlags: THBF_ENABLED,
                ..Default::default()
            },
            THUMBBUTTON {
                dwMask: THB_ICON | THB_TOOLTIP | THB_FLAGS,
                iId: BTN_PLAY_PAUSE,
                hIcon: if ctx.is_playing {
                    ctx.icon_pause
                } else {
                    ctx.icon_play
                },
                szTip: [0; 260],
                dwFlags: THBF_ENABLED,
                ..Default::default()
            },
            THUMBBUTTON {
                dwMask: THB_ICON | THB_TOOLTIP | THB_FLAGS,
                iId: BTN_NEXT,
                hIcon: ctx.icon_next,
                szTip: [0; 260],
                dwFlags: THBF_ENABLED,
                ..Default::default()
            },
        ];
        set_tip(&mut buttons[0].szTip, "Previous");
        set_tip(
            &mut buttons[1].szTip,
            if ctx.is_playing { "Pause" } else { "Play" },
        );
        set_tip(&mut buttons[2].szTip, "Next");

        taskbar.ThumbBarAddButtons(hwnd, &buttons)?;
        Ok(taskbar)
    }

    unsafe extern "system" fn subclass_proc(
        hwnd: HWND,
        msg: u32,
        wparam: WPARAM,
        lparam: LPARAM,
        uid: usize,
        ref_data: usize,
    ) -> LRESULT {
        let ctx = &mut *(ref_data as *mut TaskbarContext);
        let created = TASKBAR_CREATED_MSG_ID.load(Ordering::Relaxed);

        if created != 0 && msg == created {
            ctx.taskbar = None;
            ctx.buttons_added = false;
            match add_buttons(hwnd, ctx) {
                Ok(tb) => {
                    ctx.taskbar = Some(tb);
                    ctx.buttons_added = true;
                }
                Err(err) => log::error!("taskbar ThumbBarAddButtons failed: {err}"),
            }
            return DefSubclassProc(hwnd, msg, wparam, lparam);
        }

        if msg == WM_USER_UPDATE_PLAYBACK {
            let playing = wparam.0 != 0;
            ctx.is_playing = playing;
            if let Some(ref taskbar) = ctx.taskbar {
                if ctx.buttons_added {
                    let mut btn = THUMBBUTTON {
                        dwMask: THB_ICON | THB_TOOLTIP,
                        iId: BTN_PLAY_PAUSE,
                        hIcon: if playing {
                            ctx.icon_pause
                        } else {
                            ctx.icon_play
                        },
                        szTip: [0; 260],
                        ..Default::default()
                    };
                    set_tip(
                        &mut btn.szTip,
                        if playing { "Pause" } else { "Play" },
                    );
                    let _ = taskbar.ThumbBarUpdateButtons(hwnd, &[btn]);
                }
            }
            return LRESULT(0);
        }

        if msg == WM_COMMAND {
            let notify = ((wparam.0 >> 16) & 0xFFFF) as u32;
            let id = (wparam.0 & 0xFFFF) as u32;
            if notify == THBN_CLICKED {
                let event = match id {
                    BTN_PREV => Some(EVENT_PREV),
                    BTN_PLAY_PAUSE => Some(EVENT_TOGGLE),
                    BTN_NEXT => Some(EVENT_NEXT),
                    _ => None,
                };
                if let Some(event) = event {
                    let _ = ctx.app.emit_all(event, ());
                }
                return LRESULT(0);
            }
        }

        if msg == WM_NCDESTROY {
            let _ = RemoveWindowSubclass(hwnd, Some(subclass_proc), uid);
            let _ = DestroyIcon(ctx.icon_prev);
            let _ = DestroyIcon(ctx.icon_play);
            let _ = DestroyIcon(ctx.icon_pause);
            let _ = DestroyIcon(ctx.icon_next);
            drop(Box::from_raw(ctx as *mut TaskbarContext));
        }

        DefSubclassProc(hwnd, msg, wparam, lparam)
    }

    pub fn attach(window: &Window) -> Result<(), String> {
        let hwnd = hwnd_from_window(window)?;
        let app = window.app_handle().clone();

        if TASKBAR_CREATED_MSG_ID.load(Ordering::Relaxed) == 0 {
            let name = wide("TaskbarButtonCreated");
            let id = unsafe { RegisterWindowMessageW(PCWSTR(name.as_ptr())) };
            TASKBAR_CREATED_MSG_ID.store(id, Ordering::Relaxed);
        }

        let ctx = Box::new(TaskbarContext {
            app,
            taskbar: None,
            buttons_added: false,
            icon_prev: unsafe { create_glyph_icon(Glyph::Prev) },
            icon_play: unsafe { create_glyph_icon(Glyph::Play) },
            icon_pause: unsafe { create_glyph_icon(Glyph::Pause) },
            icon_next: unsafe { create_glyph_icon(Glyph::Next) },
            is_playing: false,
        });
        let ptr = Box::into_raw(ctx);

        unsafe {
            if !SetWindowSubclass(hwnd, Some(subclass_proc), SUBCLASS_ID, ptr as usize)
                .as_bool()
            {
                drop(Box::from_raw(ptr));
                return Err("SetWindowSubclass failed".into());
            }
            let msg_id = TASKBAR_CREATED_MSG_ID.load(Ordering::Relaxed);
            if msg_id != 0 {
                let _ = PostMessageW(hwnd, msg_id, WPARAM(0), LPARAM(0));
            }
        }

        Ok(())
    }

    pub fn set_playback_state(window: &Window, is_playing: bool) -> Result<(), String> {
        let hwnd = hwnd_from_window(window)?;
        unsafe {
            let _ = PostMessageW(
                hwnd,
                WM_USER_UPDATE_PLAYBACK,
                WPARAM(if is_playing { 1 } else { 0 }),
                LPARAM(0),
            );
        }
        Ok(())
    }
}

#[cfg(windows)]
pub use win::{attach, set_playback_state};

#[cfg(not(windows))]
pub fn attach(_window: &tauri::Window) -> Result<(), String> {
    Ok(())
}

#[cfg(not(windows))]
pub fn set_playback_state(_window: &tauri::Window, _is_playing: bool) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn set_taskbar_playback_state(
    window: tauri::Window,
    is_playing: bool,
) -> Result<(), String> {
    set_playback_state(&window, is_playing)
}
