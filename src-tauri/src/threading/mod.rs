use reqwest;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{Manager, Runtime, Window}; 

use crate::types::Window_Emit;

fn make_api_call<R: Runtime>(window: &tauri::Window<R>, endpoint: &str, i: usize, id: u32) {
    // Perform a GET request using reqwest
    window.emit("progress_start", Window_Emit {id: id.clone(), state: true, data: endpoint}).unwrap();
    thread::sleep(Duration::from_secs(4));
    match reqwest::blocking::get(endpoint) {
        Ok(response) => {
            if response.status().is_success() {
                // Process the response if needed
                println!("Successful response from {}, thread {}: {:?}", endpoint, i, response);
            } else {
                println!("Unsuccessful response from {}, thread {}: {:?}", endpoint, i, response);
            }
            window.emit("progress_end", Window_Emit {id: id.clone(), state: false, data: endpoint}).unwrap();

        }
        Err(err) => {
            println!("Error making request to {}, thread{}: {:?}", endpoint, i, err);
        }
    }
}

pub fn threaded_execution<R: Runtime>(
    window: tauri::Window<R>,
    endpoints: Vec<&'static str>,
    num_workers: usize,
) {
    let mut count: u32 = 1;
    let endpoints_arc = Arc::new(Mutex::new(endpoints));
    let mut handles = vec![];
    let counter = Arc::new(Mutex::new(0));

    for i in 0..num_workers {
        let counter_clone = Arc::clone(&counter);
        let win = window.clone();
        let endpoints_clone = Arc::clone(&endpoints_arc);

        let handle = thread::spawn(move || {
            loop {
                let mut endpoints = endpoints_clone.lock().unwrap();
                // let mut counter = counter_clone.lock().unwrap();
                // *counter += 1;
                
                if let Some(endpoint) = endpoints.pop() {
                    let id = endpoints.len();
                    drop(endpoints);
                    make_api_call(&win, endpoint, i, id.try_into().unwrap());
                    // make_api_call(endpoint, i, 1);
                } else {
                    break;
                }
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}

// pub fn non_threaded_execution(endpoints: Vec<&str>) {
//     for endpoint in endpoints {
//         make_api_call(endpoint, 1, 1);
//     }
// }
