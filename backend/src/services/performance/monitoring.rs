//! System monitoring module for performance tracking
//!
//! This module handles system-level monitoring including CPU usage, memory usage,
//! and system resource tracking.

/// System monitoring service
pub struct SystemMonitor;

impl SystemMonitor {
    pub fn new() -> Self {
        Self
    }

    /// Get memory usage as a fraction (0.0 - 1.0)
    pub fn get_memory_usage(&self) -> f64 {
        // Linux implementation using /proc/meminfo; returns fraction used (0.0 - 1.0)
        #[cfg(target_os = "linux")]
        {
            if let Ok(content) = std::fs::read_to_string("/proc/meminfo") {
                let mut mem_total_kb: u64 = 0;
                let mut mem_available_kb: u64 = 0;
                for line in content.lines() {
                    if line.starts_with("MemTotal:") {
                        if let Some(v) = line.split_whitespace().nth(1) {
                            mem_total_kb = v.parse().unwrap_or(0);
                        }
                    } else if line.starts_with("MemAvailable:") {
                        if let Some(v) = line.split_whitespace().nth(1) {
                            mem_available_kb = v.parse().unwrap_or(0);
                        }
                    }
                }
                if mem_total_kb > 0 {
                    let used = mem_total_kb.saturating_sub(mem_available_kb) as f64;
                    return (used / mem_total_kb as f64).clamp(0.0, 1.0);
                }
            }
        }
        0.0
    }

    /// Get CPU usage as a fraction (0.0 - 1.0)
    pub fn get_cpu_usage(&self) -> f64 {
        // Approximate CPU utilization using deltas from /proc/stat first line.
        // Stores last sample in a static mutex to compute deltas across calls.
        lazy_static::lazy_static! {
            static ref CPU_LAST_SAMPLE: std::sync::Mutex<Option<(u64, u64)>> = std::sync::Mutex::new(None);
        }
        #[cfg(target_os = "linux")]
        {
            if let Ok(content) = std::fs::read_to_string("/proc/stat") {
                if let Some(first_line) = content.lines().next() {
                    if first_line.starts_with("cpu ") {
                        let mut parts = first_line.split_whitespace();
                        let _cpu = parts.next(); // "cpu"
                                                 // user nice system idle iowait irq softirq steal guest guest_nice
                        let vals: Vec<u64> = parts
                            .take(10)
                            .filter_map(|s| s.parse::<u64>().ok())
                            .collect();
                        if vals.len() >= 4 {
                            let idle = vals[3] + vals.get(4).copied().unwrap_or(0); // idle + iowait
                            let total: u64 = vals.iter().sum();
                            let mut last = match CPU_LAST_SAMPLE.lock() {
                                Ok(guard) => guard,
                                Err(e) => {
                                    log::error!("CPU_LAST_SAMPLE mutex poisoned: {}", e);
                                    return 0.0;
                                }
                            };
                            let usage = if let Some((last_total, last_idle)) = *last {
                                let dt = total.saturating_sub(last_total);
                                let di = idle.saturating_sub(last_idle);
                                if dt > 0 {
                                    (1.0 - (di as f64 / dt as f64)).clamp(0.0, 1.0)
                                } else {
                                    0.0
                                }
                            } else {
                                0.0
                            };
                            *last = Some((total, idle));
                            return usage;
                        }
                    }
                }
            }
        }
        0.0
    }

    /// Get comprehensive system metrics
    pub fn get_system_metrics(&self) -> SystemMetrics {
        SystemMetrics {
            memory_usage: self.get_memory_usage(),
            cpu_usage: self.get_cpu_usage(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
}

/// System metrics structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SystemMetrics {
    pub memory_usage: f64,
    pub cpu_usage: f64,
    pub timestamp: String,
}

impl Default for SystemMonitor {
    fn default() -> Self {
        Self::new()
    }
}
