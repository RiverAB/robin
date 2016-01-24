<!DOCTYPE html>
<html>
<head>
    <title>{{ robin.setting('site.site-title') }}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width" />
    <link href='https://fonts.googleapis.com/css?family=Open+Sans:400,400italic,700,700italic' rel='stylesheet' type='text/css'>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
    <link rel="stylesheet" type="text/css" href="{{ robin.theme_path('main.css') }}" />
</head>
<body>
    
    {% if robin.content('header.visibility') == 1 %}
    <div id="hero" style="background-image: url({{ robin.content('header.hero_image') }}); background-color: {{ robin.content('header.hero_bg_color') }}">
        <div class="inner">

            <header id="header">
                <ul id="main-nav" class="clearfix">
                    <li class="brand">Robin CMS</li>
                </ul>
                    
                <ul id="locales" class="clearfix">
                    {% for key, item in robin.locales() %}
                    {% set slug = key == default_locale? '' : key %}
                    <li><a href="{{ robin.route('home', [slug]) }}"{{ key == current_locale? ' class="current"' }}>{{ item.name }}</a></li>
                    {% endfor %}
                </ul>
            </header>


            <div class="block">
                <h1>{{ robin.content('header.hero_text', 'No translated text found') }}</h1>
                <div class="tabline">{{ robin.content('header.hero_tagline') }}</div>
            </div>

        </div>
    </div>
    {% endif %}

    <div class="section" style="margin-bottom: 0; padding-bottom: 0;">
        <div class="inner">

            <div class="blurbs-container clearfix">
            {% for item in robin.list_items('reasons') %}

                <div class="blurb">

                    <div class="blurb-icon"><span class="fa fa-{{ item.icon }}"></span></div>
                    <div class="blurb-title">{{ item.title }}</div>
                    <div class="blurb-desc">{{ item.description | raw }}</div>

                </div>

            {% endfor %}
            </div>
        </div>
    </div>

    <div class="section alt">
        <div class="inner">

            <h2>{{ robin.content('section-1.title', 'No translated text found') | raw }}</h2>
            <p>{{ robin.content('section-1.content', 'No translated text found') | raw }}</p>

        </div>
    </div>


    <div class="section">
        <div class="inner">

            <h2>{{ robin.content('section-2.title', 'No translated text found') | raw }}</h2>
            <p>{{ robin.content('section-2.content', 'No translated text found') | raw }}</p>

        </div>
    </div>

    <footer id="footer" class="section">
        <div class="inner">


            <div class="copyright">{{ robin.setting('site.copyright') | raw }}</div>

            {% for item in robin.list_items('footer-links') %}
            {%  if item.hidden == 0 %}
                <a href="{{ item.url }}" target="{{ item.target }}">{{ item.label }}</a>
            {%  endif %}
            {% endfor %}

        </div>
    </footer>

</body>
</html>