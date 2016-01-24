<?php

// This is the front route. It matches / and locales like /sv, /de etc.
// The avalilable locales can be found in the config file.
$app->router->get(['/{locale:[a-zA-Z]{2}}?', 'home'], function($locale = null) use($app) {

    if (is_null($locale)) {
        $locale = $app->config->get('default_locale');
    }

    if (!$app->locales->exists($locale)) {
        return $app->router->triggerError(404);
    }

    $app->locales->setLocale($locale);
    $app->view->addGlobal('current_locale', $locale);

    return $app->make('App\Controllers\FrontController')->showHome();

});
