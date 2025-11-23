// Minimal test binary to verify Rust execution in container
fn main() {
    // Print IMMEDIATELY - before anything else
    let _ = std::io::Write::write_all(&mut std::io::stderr(), b"MINIMAL TEST: MAIN FUNCTION CALLED\n");
    let _ = std::io::Write::flush(&mut std::io::stderr());
    
    eprintln!("MINIMAL TEST: About to create Tokio runtime...");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    
    let rt = match tokio::runtime::Runtime::new() {
        Ok(runtime) => {
            eprintln!("MINIMAL TEST: Tokio runtime created successfully!");
            std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
            runtime
        }
        Err(e) => {
            eprintln!("MINIMAL TEST: Failed to create Tokio runtime: {}", e);
            std::process::exit(1);
        }
    };
    
    eprintln!("MINIMAL TEST: About to run async block...");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    
    rt.block_on(async {
        eprintln!("MINIMAL TEST: Inside async block!");
        std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        eprintln!("MINIMAL TEST: Async block completed!");
        std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    });
    
    eprintln!("MINIMAL TEST: Main function completed successfully!");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
}
