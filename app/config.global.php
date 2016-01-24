<?php

return [

    'debug' => false,

    'theme' => 'default',

    'default_locale' => 'en',

    'uploads' => [
        'path' => realpath(__DIR__ . '/../public/uploads'),
    ],

    'storage' => [
        'path'  => realpath(__DIR__ . '/../storage/data/example'),
        'cache' => realpath(__DIR__ . '/../storage/cache'),
    ],


    /**
     * Service providers
     * ------------------------------------------------------------------------
     */
    
    'providers' => [
        'RobinCms\Core\RobinServiceProvider',
    ],

    /**
     * Admin specific settings
     * ------------------------------------------------------------------------
     */
    'admin' => [
        'theme'      => 'default',
        
        'url_prefix' => 'robin',
    ],

];