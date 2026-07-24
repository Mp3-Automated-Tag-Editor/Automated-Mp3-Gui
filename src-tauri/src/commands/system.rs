use crate::models::{NetworkDetails, ServerHealth};
use log::{debug, error, info};
use std::env;
use std::fs::read_dir;
use std::time::Instant;
use tauri::{Manager, Runtime, Window};

#[tauri::command]
pub async fn close_splashscreen(window: Window) {
    // Close splashscreen
    window
        .get_window("splashscreen")
        .expect("no window labeled 'splashscreen' found")
        .close()
        .unwrap();
    // Show main window
    window
        .get_window("main")
        .expect("no window labeled 'main' found")
        .show()
        .unwrap();
}

#[tauri::command]
pub async fn return_summary() -> Result<String, ()> {
    Ok("Summary: ".to_string())
}

#[tauri::command]
pub async fn get_network_data() -> Result<NetworkDetails, String> {
    let check_url = "https://www.google.com/";
    let req_url = format!(
        "{}{}",
        env::var("HEALTH_ENDPOINT").expect("Env Not set"),
        "health"
    );
    // Check if connected to a network
    let if_connected = reqwest::get(check_url).await.is_ok();

    info!("Network Connected: {}", if_connected);
    if !if_connected {
        error!("Network Connected: Failed");
        return Ok(NetworkDetails {
            if_connected: false,
            speed: 0,
            latency: 0,
        });
    }

    let start_time = Instant::now();
    let _ = reqwest::get(req_url).await.is_ok();
    let elapsed_time = start_time.elapsed();

    info!("Completed Network Checks");
    Ok(NetworkDetails {
        if_connected: true,
        speed: 0,
        latency: elapsed_time.as_millis() as u32,
    })
}

#[tauri::command]
pub async fn get_server_health() -> Result<ServerHealth, String> {
    let req_url = format!(
        "{}{}",
        env::var("HEALTH_ENDPOINT").expect("Env Not set"),
        "health"
    );

    let response_result = reqwest::get(req_url).await;

    match response_result {
        Ok(response) => {
            if response.status().is_success() {
                let body_bytes_result = response.bytes().await;
                debug!("{:?}", body_bytes_result);

                match body_bytes_result {
                    Ok(body_bytes) => {
                        let data_result: Result<ServerHealth, _> =
                            serde_json::from_slice(&body_bytes);
                        match data_result {
                            Ok(data) => {
                                info!("Server Health Checks - success");
                                Ok(data)
                            }
                            Err(err) => {
                                info!("Server Health Checks - failed");
                                Ok(ServerHealth {
                                    status: 400,
                                    message: format!("Failed to deserialize data: {}", err),
                                })
                            }
                        }
                    }
                    Err(err) => {
                        info!("Server Health Checks - failed");
                        Err(format!("Failed to read response body: {}", err))
                    }
                }
            } else {
                info!("Server Health Checks - failed");
                Ok(ServerHealth {
                    status: 400,
                    message: format!("Request failed with status code: {}", response.status()),
                })
            }
        }
        Err(err) => Err(format!("Failed to fetch data: {}", err)), // Return error if request fails
    }
}

#[tauri::command]
pub async fn long_job<R: Runtime>(window: tauri::Window<R>) {
    println!("Hello from BE");
    for i in 0..101 {
        // println!("{}", i.clone());
        window.emit("progress", i).unwrap();
        // window.emit("confirmation", i).unwrap();
        std::thread::sleep(std::time::Duration::from_secs(2));
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn initialize_db<R: Runtime>(window: tauri::Window<R>, path_var: String) -> Result<u32, ()> {
    println!("Started Build");
    // let _ = db::db_populate(path_var.clone()).await;
    let num_paths: u32 = read_dir(path_var).unwrap().count().try_into().unwrap();
    std::thread::sleep(std::time::Duration::from_secs(2));
    window.emit("db_init_paths", num_paths).unwrap();
    Ok(num_paths)
}
