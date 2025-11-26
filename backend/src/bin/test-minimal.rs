// Minimal test binary to verify basic execution
fn main() {
    // Write to file immediately
    let _ = std::fs::write("/tmp/test-minimal-called.txt", "MINIMAL MAIN CALLED\n");
    
    // Print immediately
    eprintln!("=== MINIMAL TEST BINARY START ===");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
    
    println!("MINIMAL TEST BINARY - STDOUT");
    std::io::Write::flush(&mut std::io::stdout()).unwrap_or(());
    
    // Sleep to verify it's running
    std::thread::sleep(std::time::Duration::from_secs(2));
    
    eprintln!("=== MINIMAL TEST BINARY END ===");
    std::io::Write::flush(&mut std::io::stderr()).unwrap_or(());
}


