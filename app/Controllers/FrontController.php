<?php namespace App\Controllers;

use RobinCms\Core\Controller;

class FrontController extends Controller
{

    public function showHome()
    {
        $data = [
            'content'        => [],
            'locales'        => $this->locales->getAll(),
            'current_locale' => $this->locales->getCurrent(),
        ];

        return $this->view->render('home.tpl', $data);
    }

}