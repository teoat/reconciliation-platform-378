// backend/src/services/mobile_optimization.rs
use crate::errors::AppResult;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Progressive Web App configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PWAConfig {
    pub name: String,
    pub short_name: String,
    pub description: String,
    pub start_url: String,
    pub display: DisplayMode,
    pub orientation: Orientation,
    pub theme_color: String,
    pub background_color: String,
    pub icons: Vec<PWAIcon>,
    pub categories: Vec<String>,
    pub lang: String,
    pub scope: String,
}

/// Display modes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DisplayMode {
    Fullscreen,
    Standalone,
    MinimalUi,
    Browser,
}

/// Orientation modes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Orientation {
    Portrait,
    Landscape,
    Any,
}

/// PWA icon
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PWAIcon {
    pub src: String,
    pub sizes: String,
    pub r#type: String,
    pub purpose: String,
}

/// Service worker configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceWorkerConfig {
    pub cache_strategy: CacheStrategy,
    pub offline_fallback: String,
    pub precache_resources: Vec<String>,
    pub runtime_cache: HashMap<String, RuntimeCacheConfig>,
    pub update_check_interval: u32,
}

/// Cache strategies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CacheStrategy {
    CacheFirst,
    NetworkFirst,
    StaleWhileRevalidate,
    NetworkOnly,
    CacheOnly,
}

/// Runtime cache configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeCacheConfig {
    pub strategy: CacheStrategy,
    pub max_entries: u32,
    pub max_age_seconds: u32,
}

/// Offline functionality configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfflineConfig {
    pub enabled: bool,
    pub sync_strategy: SyncStrategy,
    pub conflict_resolution: ConflictResolution,
    pub max_offline_storage_mb: u32,
    pub sync_interval_seconds: u32,
}

/// Sync strategies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncStrategy {
    Immediate,
    Background,
    Manual,
    Scheduled,
}

/// Conflict resolution strategies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictResolution {
    ServerWins,
    ClientWins,
    LastModifiedWins,
    Manual,
}

/// Mobile-specific UI configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MobileUIConfig {
    pub touch_targets_min_size: u32,
    pub gesture_support: bool,
    pub haptic_feedback: bool,
    pub pull_to_refresh: bool,
    pub infinite_scroll: bool,
    pub bottom_navigation: bool,
    pub swipe_gestures: bool,
}

/// Mobile optimization service
pub struct MobileOptimizationService {
    pwa_config: Arc<RwLock<PWAConfig>>,
    service_worker_config: Arc<RwLock<ServiceWorkerConfig>>,
    offline_config: Arc<RwLock<OfflineConfig>>,
    mobile_ui_config: Arc<RwLock<MobileUIConfig>>,
    optimization_stats: Arc<RwLock<OptimizationStats>>,
}

/// Optimization statistics
#[derive(Debug, Clone, Default)]
pub struct OptimizationStats {
    pub total_users: u32,
    pub mobile_users: u32,
    pub pwa_installs: u32,
    pub offline_usage: u32,
    pub average_load_time_ms: f64,
    pub cache_hit_rate: f64,
}

impl MobileOptimizationService {
    pub async fn new() -> Self {
        let mut service = Self {
            pwa_config: Arc::new(RwLock::new(PWAConfig {
                name: "378 Reconciliation Platform".to_string(),
                short_name: "378 Recon".to_string(),
                description: "Financial reconciliation platform".to_string(),
                start_url: "/".to_string(),
                display: DisplayMode::Standalone,
                orientation: Orientation::Any,
                theme_color: "#3B82F6".to_string(),
                background_color: "#FFFFFF".to_string(),
                icons: vec![
                    PWAIcon {
                        src: "/icons/icon-192x192.png".to_string(),
                        sizes: "192x192".to_string(),
                        r#type: "image/png".to_string(),
                        purpose: "any maskable".to_string(),
                    },
                    PWAIcon {
                        src: "/icons/icon-512x512.png".to_string(),
                        sizes: "512x512".to_string(),
                        r#type: "image/png".to_string(),
                        purpose: "any maskable".to_string(),
                    },
                ],
                categories: vec!["business".to_string(), "finance".to_string()],
                lang: "en".to_string(),
                scope: "/".to_string(),
            })),
            service_worker_config: Arc::new(RwLock::new(ServiceWorkerConfig {
                cache_strategy: CacheStrategy::StaleWhileRevalidate,
                offline_fallback: "/offline.html".to_string(),
                precache_resources: vec![
                    "/".to_string(),
                    "/static/css/main.css".to_string(),
                    "/static/js/main.js".to_string(),
                ],
                runtime_cache: HashMap::new(),
                update_check_interval: 3600,
            })),
            offline_config: Arc::new(RwLock::new(OfflineConfig {
                enabled: true,
                sync_strategy: SyncStrategy::Background,
                conflict_resolution: ConflictResolution::LastModifiedWins,
                max_offline_storage_mb: 100,
                sync_interval_seconds: 300,
            })),
            mobile_ui_config: Arc::new(RwLock::new(MobileUIConfig {
                touch_targets_min_size: 44,
                gesture_support: true,
                haptic_feedback: true,
                pull_to_refresh: true,
                infinite_scroll: true,
                bottom_navigation: true,
                swipe_gestures: true,
            })),
            optimization_stats: Arc::new(RwLock::new(OptimizationStats::default())),
        };
        
        service.initialize_runtime_cache().await;
        service
    }

    /// Initialize runtime cache configuration
    async fn initialize_runtime_cache(&mut self) {
        let mut config = self.service_worker_config.write().await;
        config.runtime_cache.insert(
            "api".to_string(),
            RuntimeCacheConfig {
                strategy: CacheStrategy::NetworkFirst,
                max_entries: 100,
                max_age_seconds: 300,
            },
        );
        config.runtime_cache.insert(
            "images".to_string(),
            RuntimeCacheConfig {
                strategy: CacheStrategy::CacheFirst,
                max_entries: 50,
                max_age_seconds: 86400,
            },
        );
        config.runtime_cache.insert(
            "static".to_string(),
            RuntimeCacheConfig {
                strategy: CacheStrategy::CacheFirst,
                max_entries: 200,
                max_age_seconds: 31536000,
            },
        );
    }

    /// Generate PWA manifest
    pub async fn generate_pwa_manifest(&self) -> AppResult<String> {
        let config = self.pwa_config.read().await;
        let manifest = serde_json::to_string_pretty(&*config)?;
        Ok(manifest)
    }

    /// Generate service worker script
    pub async fn generate_service_worker(&self) -> AppResult<String> {
        let config = self.service_worker_config.read().await;
        let offline_config = self.offline_config.read().await;
        
        let mut script = String::new();
        script.push_str("// Service Worker for 378 Reconciliation Platform\n");
        script.push_str("const CACHE_NAME = '378-recon-v1';\n");
        script.push_str("const OFFLINE_URL = '/offline.html';\n\n");
        
        script.push_str("// Install event\n");
        script.push_str("self.addEventListener('install', (event) => {\n");
        script.push_str("  event.waitUntil(\n");
        script.push_str("    caches.open(CACHE_NAME)\n");
        script.push_str("      .then((cache) => {\n");
        script.push_str("        return cache.addAll([\n");
        
        for resource in &config.precache_resources {
            script.push_str(&format!("          '{}',\n", resource));
        }
        
        script.push_str("        ]);\n");
        script.push_str("      })\n");
        script.push_str("  );\n");
        script.push_str("});\n\n");
        
        script.push_str("// Fetch event\n");
        script.push_str("self.addEventListener('fetch', (event) => {\n");
        script.push_str("  if (event.request.mode === 'navigate') {\n");
        script.push_str("    event.respondWith(\n");
        script.push_str("      fetch(event.request)\n");
        script.push_str("        .catch(() => {\n");
        script.push_str("          return caches.open(CACHE_NAME)\n");
        script.push_str("            .then((cache) => {\n");
        script.push_str("              return cache.match(OFFLINE_URL);\n");
        script.push_str("            });\n");
        script.push_str("        })\n");
        script.push_str("    );\n");
        script.push_str("  } else {\n");
        script.push_str("    event.respondWith(\n");
        script.push_str("      caches.match(event.request)\n");
        script.push_str("        .then((response) => {\n");
        script.push_str("          if (response) {\n");
        script.push_str("            return response;\n");
        script.push_str("          }\n");
        script.push_str("          return fetch(event.request);\n");
        script.push_str("        })\n");
        script.push_str("    );\n");
        script.push_str("  }\n");
        script.push_str("});\n\n");
        
        script.push_str("// Background sync\n");
        if offline_config.enabled {
            script.push_str("self.addEventListener('sync', (event) => {\n");
            script.push_str("  if (event.tag === 'background-sync') {\n");
            script.push_str("    event.waitUntil(doBackgroundSync());\n");
            script.push_str("  }\n");
            script.push_str("});\n\n");
            
            script.push_str("async function doBackgroundSync() {\n");
            script.push_str("  // Implement background sync logic\n");
            script.push_str("  console.log('Background sync triggered');\n");
            script.push_str("}\n");
        }
        
        Ok(script)
    }

    /// Update PWA configuration
    pub async fn update_pwa_config(&self, config: PWAConfig) -> AppResult<()> {
        *self.pwa_config.write().await = config;
        Ok(())
    }

    /// Update service worker configuration
    pub async fn update_service_worker_config(&self, config: ServiceWorkerConfig) -> AppResult<()> {
        *self.service_worker_config.write().await = config;
        Ok(())
    }

    /// Update offline configuration
    pub async fn update_offline_config(&self, config: OfflineConfig) -> AppResult<()> {
        *self.offline_config.write().await = config;
        Ok(())
    }

    /// Update mobile UI configuration
    pub async fn update_mobile_ui_config(&self, config: MobileUIConfig) -> AppResult<()> {
        *self.mobile_ui_config.write().await = config;
        Ok(())
    }

    /// Get PWA configuration
    pub async fn get_pwa_config(&self) -> AppResult<PWAConfig> {
        let config = self.pwa_config.read().await.clone();
        Ok(config)
    }

    /// Get service worker configuration
    pub async fn get_service_worker_config(&self) -> AppResult<ServiceWorkerConfig> {
        let config = self.service_worker_config.read().await.clone();
        Ok(config)
    }

    /// Get offline configuration
    pub async fn get_offline_config(&self) -> AppResult<OfflineConfig> {
        let config = self.offline_config.read().await.clone();
        Ok(config)
    }

    /// Get mobile UI configuration
    pub async fn get_mobile_ui_config(&self) -> AppResult<MobileUIConfig> {
        let config = self.mobile_ui_config.read().await.clone();
        Ok(config)
    }

    /// Generate mobile-specific CSS
    pub async fn generate_mobile_css(&self) -> AppResult<String> {
        let ui_config = self.mobile_ui_config.read().await;
        
        let mut css = String::new();
        css.push_str("/* Mobile-specific styles */\n");
        css.push_str("@media (max-width: 768px) {\n");
        
        // Touch targets
        css.push_str("  .touch-target {\n");
        css.push_str(&format!("    min-height: {}px;\n", ui_config.touch_targets_min_size));
        css.push_str(&format!("    min-width: {}px;\n", ui_config.touch_targets_min_size));
        css.push_str("  }\n\n");
        
        // Pull to refresh
        if ui_config.pull_to_refresh {
            css.push_str("  .pull-to-refresh {\n");
            css.push_str("    position: relative;\n");
            css.push_str("    overflow: hidden;\n");
            css.push_str("  }\n\n");
        }
        
        // Bottom navigation
        if ui_config.bottom_navigation {
            css.push_str("  .bottom-navigation {\n");
            css.push_str("    position: fixed;\n");
            css.push_str("    bottom: 0;\n");
            css.push_str("    left: 0;\n");
            css.push_str("    right: 0;\n");
            css.push_str("    background: white;\n");
            css.push_str("    border-top: 1px solid #e5e7eb;\n");
            css.push_str("    z-index: 1000;\n");
            css.push_str("  }\n\n");
        }
        
        // Swipe gestures
        if ui_config.swipe_gestures {
            css.push_str("  .swipeable {\n");
            css.push_str("    touch-action: pan-x;\n");
            css.push_str("  }\n\n");
        }
        
        css.push_str("}\n");
        
        Ok(css)
    }

    /// Generate mobile-specific JavaScript
    pub async fn generate_mobile_js(&self) -> AppResult<String> {
        let ui_config = self.mobile_ui_config.read().await;
        
        let mut js = String::new();
        js.push_str("// Mobile-specific JavaScript\n");
        
        // Pull to refresh
        if ui_config.pull_to_refresh {
            js.push_str("// Pull to refresh implementation\n");
            js.push_str("let startY = 0;\n");
            js.push_str("let currentY = 0;\n");
            js.push_str("let isRefreshing = false;\n\n");
            
            js.push_str("document.addEventListener('touchstart', (e) => {\n");
            js.push_str("  startY = e.touches[0].clientY;\n");
            js.push_str("});\n\n");
            
            js.push_str("document.addEventListener('touchmove', (e) => {\n");
            js.push_str("  currentY = e.touches[0].clientY;\n");
            js.push_str("  const diff = currentY - startY;\n");
            js.push_str("  if (diff > 100 && window.scrollY === 0) {\n");
            js.push_str("    e.preventDefault();\n");
            js.push_str("    if (!isRefreshing) {\n");
            js.push_str("      isRefreshing = true;\n");
            js.push_str("      refreshData();\n");
            js.push_str("    }\n");
            js.push_str("  }\n");
            js.push_str("});\n\n");
        }
        
        // Haptic feedback
        if ui_config.haptic_feedback {
            js.push_str("// Haptic feedback\n");
            js.push_str("function triggerHapticFeedback() {\n");
            js.push_str("  if ('vibrate' in navigator) {\n");
            js.push_str("    navigator.vibrate(50);\n");
            js.push_str("  }\n");
            js.push_str("}\n\n");
        }
        
        // Swipe gestures
        if ui_config.swipe_gestures {
            js.push_str("// Swipe gesture detection\n");
            js.push_str("let swipeStartX = 0;\n");
            js.push_str("let swipeStartY = 0;\n\n");
            
            js.push_str("document.addEventListener('touchstart', (e) => {\n");
            js.push_str("  swipeStartX = e.touches[0].clientX;\n");
            js.push_str("  swipeStartY = e.touches[0].clientY;\n");
            js.push_str("});\n\n");
            
            js.push_str("document.addEventListener('touchend', (e) => {\n");
            js.push_str("  const swipeEndX = e.changedTouches[0].clientX;\n");
            js.push_str("  const swipeEndY = e.changedTouches[0].clientY;\n");
            js.push_str("  const diffX = swipeStartX - swipeEndX;\n");
            js.push_str("  const diffY = swipeStartY - swipeEndY;\n");
            js.push_str("  \n");
            js.push_str("  if (Math.abs(diffX) > Math.abs(diffY)) {\n");
            js.push_str("    if (diffX > 50) {\n");
            js.push_str("      // Swipe left\n");
            js.push_str("      handleSwipeLeft();\n");
            js.push_str("    } else if (diffX < -50) {\n");
            js.push_str("      // Swipe right\n");
            js.push_str("      handleSwipeRight();\n");
            js.push_str("    }\n");
            js.push_str("  }\n");
            js.push_str("});\n\n");
        }
        
        // Infinite scroll
        if ui_config.infinite_scroll {
            js.push_str("// Infinite scroll\n");
            js.push_str("let isLoading = false;\n");
            js.push_str("let hasMore = true;\n\n");
            
            js.push_str("window.addEventListener('scroll', () => {\n");
            js.push_str("  if (isLoading || !hasMore) return;\n");
            js.push_str("  \n");
            js.push_str("  const scrollTop = window.pageYOffset;\n");
            js.push_str("  const windowHeight = window.innerHeight;\n");
            js.push_str("  const documentHeight = document.documentElement.scrollHeight;\n");
            js.push_str("  \n");
            js.push_str("  if (scrollTop + windowHeight >= documentHeight - 100) {\n");
            js.push_str("    loadMoreContent();\n");
            js.push_str("  }\n");
            js.push_str("});\n\n");
        }
        
        Ok(js)
    }

    /// Track mobile usage statistics
    pub async fn track_mobile_usage(&self, user_id: Uuid, device_type: String, pwa_installed: bool) -> AppResult<()> {
        let mut stats = self.optimization_stats.write().await;
        stats.total_users += 1;
        
        if device_type == "mobile" {
            stats.mobile_users += 1;
        }
        
        if pwa_installed {
            stats.pwa_installs += 1;
        }
        
        Ok(())
    }

    /// Get optimization statistics
    pub async fn get_optimization_stats(&self) -> AppResult<OptimizationStats> {
        let stats = self.optimization_stats.read().await.clone();
        Ok(stats)
    }

    /// Generate mobile optimization report
    pub async fn generate_optimization_report(&self) -> AppResult<String> {
        let stats = self.get_optimization_stats().await?;
        let pwa_config = self.get_pwa_config().await?;
        let offline_config = self.get_offline_config().await?;
        let mobile_ui_config = self.get_mobile_ui_config().await?;
        
        let mut report = String::new();
        report.push_str("# Mobile Optimization Report\n\n");
        
        report.push_str("## PWA Configuration\n");
        report.push_str(&format!("- **Name:** {}\n", pwa_config.name));
        report.push_str(&format!("- **Display Mode:** {:?}\n", pwa_config.display));
        report.push_str(&format!("- **Theme Color:** {}\n", pwa_config.theme_color));
        report.push_str(&format!("- **Icons:** {} configured\n\n", pwa_config.icons.len()));
        
        report.push_str("## Offline Functionality\n");
        report.push_str(&format!("- **Enabled:** {}\n", offline_config.enabled));
        report.push_str(&format!("- **Sync Strategy:** {:?}\n", offline_config.sync_strategy));
        report.push_str(&format!("- **Max Storage:** {} MB\n\n", offline_config.max_offline_storage_mb));
        
        report.push_str("## Mobile UI Features\n");
        report.push_str(&format!("- **Touch Targets:** {}px minimum\n", mobile_ui_config.touch_targets_min_size));
        report.push_str(&format!("- **Gesture Support:** {}\n", mobile_ui_config.gesture_support));
        report.push_str(&format!("- **Haptic Feedback:** {}\n", mobile_ui_config.haptic_feedback));
        report.push_str(&format!("- **Pull to Refresh:** {}\n", mobile_ui_config.pull_to_refresh));
        report.push_str(&format!("- **Infinite Scroll:** {}\n", mobile_ui_config.infinite_scroll));
        report.push_str(&format!("- **Bottom Navigation:** {}\n", mobile_ui_config.bottom_navigation));
        report.push_str(&format!("- **Swipe Gestures:** {}\n\n", mobile_ui_config.swipe_gestures));
        
        report.push_str("## Usage Statistics\n");
        report.push_str(&format!("- **Total Users:** {}\n", stats.total_users));
        report.push_str(&format!("- **Mobile Users:** {}\n", stats.mobile_users));
        report.push_str(&format!("- **PWA Installs:** {}\n", stats.pwa_installs));
        report.push_str(&format!("- **Offline Usage:** {}\n", stats.offline_usage));
        
        Ok(report)
    }
}

impl Default for MobileOptimizationService {
    fn default() -> Self {
        // Create a synchronous version for Default
        Self {
            pwa_config: Arc::new(RwLock::new(PWAConfig {
                name: "378 Reconciliation Platform".to_string(),
                short_name: "378 Recon".to_string(),
                description: "Financial reconciliation platform".to_string(),
                start_url: "/".to_string(),
                display: DisplayMode::Standalone,
                background_color: "#ffffff".to_string(),
                theme_color: "#3b82f6".to_string(),
                icons: vec![],
                categories: vec!["finance".to_string(), "business".to_string()],
                lang: "en".to_string(),
                scope: "/".to_string(),
                orientation: Orientation::Portrait,
            })),
            service_worker_config: Arc::new(RwLock::new(ServiceWorkerConfig {
                cache_strategy: CacheStrategy::CacheFirst,
                offline_fallback: "/offline.html".to_string(),
                precache_resources: vec![],
                runtime_cache: HashMap::new(),
                update_check_interval: 300, // 5 minutes
            })),
            offline_config: Arc::new(RwLock::new(OfflineConfig {
                enabled: true,
                sync_strategy: SyncStrategy::Immediate,
                conflict_resolution: ConflictResolution::ServerWins,
                max_offline_storage_mb: 50,
                sync_interval_seconds: 300,
            })),
            mobile_ui_config: Arc::new(RwLock::new(MobileUIConfig {
                touch_targets_min_size: 44,
                gesture_support: true,
                haptic_feedback: true,
                pull_to_refresh: true,
                infinite_scroll: true,
                bottom_navigation: true,
                swipe_gestures: true,
            })),
            optimization_stats: Arc::new(RwLock::new(OptimizationStats::default())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mobile_optimization_service() {
        let service = MobileOptimizationService::new().await;
        
        // Test PWA manifest generation
        let manifest = service.generate_pwa_manifest().await.unwrap();
        assert!(manifest.contains("378 Reconciliation Platform"));
        
        // Test service worker generation
        let sw_script = service.generate_service_worker().await.unwrap();
        assert!(sw_script.contains("Service Worker"));
        
        // Test mobile CSS generation
        let mobile_css = service.generate_mobile_css().await.unwrap();
        assert!(mobile_css.contains("@media (max-width: 768px)"));
        
        // Test mobile JS generation
        let mobile_js = service.generate_mobile_js().await.unwrap();
        assert!(mobile_js.contains("Mobile-specific JavaScript"));
        
        // Test configuration updates
        let mut pwa_config = service.get_pwa_config().await.unwrap();
        pwa_config.name = "Updated Name".to_string();
        service.update_pwa_config(pwa_config).await.unwrap();
        
        let updated_config = service.get_pwa_config().await.unwrap();
        assert_eq!(updated_config.name, "Updated Name");
        
        // Test usage tracking
        service.track_mobile_usage(Uuid::new_v4(), "mobile".to_string(), true).await.unwrap();
        
        let stats = service.get_optimization_stats().await.unwrap();
        assert!(stats.total_users > 0);
        assert!(stats.mobile_users > 0);
        assert!(stats.pwa_installs > 0);
        
        // Test report generation
        let report = service.generate_optimization_report().await.unwrap();
        assert!(report.contains("Mobile Optimization Report"));
    }
}
