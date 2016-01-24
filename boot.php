<?php include __DIR__ . '/vendor/autoload.php';

/**
 * Do we have some dev-modules to load?
 * ----------------------------------------------------------------------------
 */
if (is_file(__DIR__ . '/dev-modules.php')) {
    $modules = include __DIR__ . '/dev-modules.php';
    foreach($modules as $module_loader) {
        // Load the regiestered dev-modules autoloaders
        include __DIR__ . '/dev-modules/' . $module_loader;
    }
}

/**
 * Create the main App instance
 * ----------------------------------------------------------------------------
 */
$app = new RobinCms\Core\App([
    'app'         => __DIR__ . '/app',
    'public'      => __DIR__ . '/public',
    'views'       => __DIR__ . '/app/views',
]);


/**
 * Load the config first so we know what providers to register
 * ----------------------------------------------------------------------------
 */
$app->singleton('RobinCms\Core\Config', function($app) {
    return new RobinCms\Core\Config([
        $app->path('app') . '/config.global.php',
        $app->path('app') . '/config.local.php',
    ]);
});

$app->alias('RobinCms\Core\Config', 'config');


/**
 * App settings
 * ----------------------------------------------------------------------------
 */
$app->debug($app->config->get('debug'));


/**
 * Register service providers
 * ----------------------------------------------------------------------------
 */
$app->serviceProviders($app->config->get('providers'));


/**
 * Load helpers
 * ----------------------------------------------------------------------------
 */
include $app->path('core') . '/helpers/misc.php';


/**
 * Load Robin routes
 * ----------------------------------------------------------------------------
 */
include $app->path('core') . '/routes.php';


/**
 * Load app routes
 * ----------------------------------------------------------------------------
 */
include $app->path('app') . '/routes.php';


/**
 * Return the app instance
 * ----------------------------------------------------------------------------
 */
return $app;