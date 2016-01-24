/**
 * Simple Ajax Uploader
 * Version 2.4
 * https://github.com/LPology/Simple-Ajax-Uploader
 *
 * Copyright 2012-2015 LPology, LLC
 * Released under the MIT license
 */

;(function( global, factory ) {
    /*globals define, module */
    if ( typeof define === 'function' && define.amd ) {
        define( function() {
            return factory( global );
        });

    } else if ( typeof module === 'object' && module.exports ) {
        module.exports = factory( global );

    } else {
        global.ss = factory( global );
    }

}( typeof window !== 'undefined' ? window : this, function( window ) {

var ss = window.ss || {},

    // ss.trim()
    rLWhitespace = /^\s+/,
    rTWhitespace = /\s+$/,

    // ss.getUID
    uidReplace = /[xy]/g,

    // ss.getFilename()
    rPath = /.*(\/|\\)/,

    // ss.getExt()
    rExt = /.*[.]/,

    // ss.hasClass()
    rHasClass = /[\t\r\n]/g,

    // Check for Safari -- it doesn't like multi file uploading. At all.
    // http://stackoverflow.com/a/9851769/1091949
    isSafari = Object.prototype.toString.call( window.HTMLElement ).indexOf( 'Constructor' ) > 0,

    isIE7 = ( navigator.userAgent.indexOf('MSIE 7') !== -1 ),

    // Check whether XHR uploads are supported
    input = document.createElement( 'input' ),

    XhrOk;

input.type = 'file';

XhrOk = ( 'multiple' in input &&
          typeof File !== 'undefined' &&
          typeof ( new XMLHttpRequest() ).upload !== 'undefined' );


/**
* Converts object to query string
*/
ss.obj2string = function( obj, prefix ) {
    "use strict";

    var str = [];

    for ( var prop in obj ) {
        if ( obj.hasOwnProperty( prop ) ) {
            var k = prefix ? prefix + '[' + prop + ']' : prop, v = obj[prop];
            str.push( typeof v === 'object' ?
                        ss.obj2string( v, k ) :
                        encodeURIComponent( k ) + '=' + encodeURIComponent( v ) );
        }
    }

    return str.join( '&' );
};

/**
* Copies all missing properties from second object to first object
*/
ss.extendObj = function( first, second ) {
    "use strict";

    for ( var prop in second ) {
        if ( second.hasOwnProperty( prop ) ) {
            first[prop] = second[prop];
        }
    }
};

ss.addEvent = function( elem, type, fn ) {
    "use strict";

    if ( elem.addEventListener ) {
        elem.addEventListener( type, fn, false );

    } else {
        elem.attachEvent( 'on' + type, fn );
    }
    return function() {
        ss.removeEvent( elem, type, fn );
    };
};

ss.removeEvent = document.removeEventListener ?
    function( elem, type, fn ) {
        if ( elem.removeEventListener ) {
            elem.removeEventListener( type, fn, false );
        }
    } :
    function( elem, type, fn ) {
        var name = 'on' + type;

        if ( typeof elem[ name ] === 'undefined' ) {
            elem[ name ] = null;
        }

        elem.detachEvent( name, fn );
    };

ss.newXHR = function() {
    "use strict";

    if ( typeof XMLHttpRequest !== 'undefined' ) {
        return new window.XMLHttpRequest();

    } else if ( window.ActiveXObject ) {
        try {
            return new window.ActiveXObject( 'Microsoft.XMLHTTP' );
        } catch ( err ) {
            return false;
        }
    }
};

ss.encodeUTF8 = function( str ) {
    "use strict";
    /*jshint nonstandard:true*/
    return unescape( encodeURIComponent( str ) );
};

ss.getIFrame = function() {
    "use strict";

    var id = ss.getUID(),
        iframe;

    // IE7 can only create an iframe this way, all others are the other way
    if ( isIE7 ) {
        iframe = document.createElement('<iframe src="javascript:false;" name="' + id + '">');

    } else {
        iframe = document.createElement('iframe');
        /*jshint scripturl:true*/
        iframe.src = 'javascript:false;';
        iframe.name = id;
    }

    iframe.style.display = 'none';
    iframe.id = id;
    return iframe;
};

ss.getForm = function( opts ) {
    "use strict";

    var form = document.createElement('form');

    form.encoding = 'multipart/form-data'; // IE
    form.enctype = 'multipart/form-data';
    form.style.display = 'none';

    for ( var prop in opts ) {
        if ( opts.hasOwnProperty( prop ) ) {
            form[prop] = opts[prop];
        }
    }

    return form;
};

ss.getHidden = function( name, value ) {
    "use strict";

    var input = document.createElement( 'input' );

    input.type = 'hidden';
    input.name = name;
    input.value = value;
    return input;
};

/**
* Parses a JSON string and returns a Javascript object
* Borrowed from www.jquery.com
*/
ss.parseJSON = function( data ) {
    "use strict";
    /*jshint evil:true*/

    if ( !data ) {
        return false;
    }

    data = ss.trim( data + '' );

    if ( window.JSON && window.JSON.parse ) {
        try {
            // Support: Android 2.3
            // Workaround failure to string-cast null input
            return window.JSON.parse( data + '' );
        } catch ( err ) {
            return false;
        }
    }

    var rvalidtokens = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g,
        depth = null,
        requireNonComma;

    // Guard against invalid (and possibly dangerous) input by ensuring that nothing remains
    // after removing valid tokens
    return data && !ss.trim( data.replace( rvalidtokens, function( token, comma, open, close ) {

        // Force termination if we see a misplaced comma
        if ( requireNonComma && comma ) {
            depth = 0;
        }

        // Perform no more replacements after returning to outermost depth
        if ( depth === 0 ) {
            return token;
        }

        // Commas must not follow "[", "{", or ","
        requireNonComma = open || comma;

        // Determine new depth
        // array/object open ("[" or "{"): depth += true - false (increment)
        // array/object close ("]" or "}"): depth += false - true (decrement)
        // other cases ("," or primitive): depth += true - true (numeric cast)
        depth += !close - !open;

        // Remove this token
        return '';
    }) ) ?
        ( Function( 'return ' + data ) )() :
        false;
};

ss.getBox = function( elem ) {
    "use strict";

    var box,
        docElem,
        top = 0,
        left = 0;

    if ( elem.getBoundingClientRect ) {
        box = elem.getBoundingClientRect();
        docElem = document.documentElement;
        top = box.top + ( window.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 );
        left = box.left + ( window.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 );

    } else {
        do {
            left += elem.offsetLeft;
            top += elem.offsetTop;
        } while ( ( elem = elem.offsetParent ) );
    }

    return {
        top: Math.round( top ),
        left: Math.round( left )
    };
};

/**
* Helper that takes object literal
* and add all properties to element.style
* @param {Element} el
* @param {Object} styles
*/
ss.addStyles = function( elem, styles ) {
    "use strict";

    for ( var name in styles ) {
        if ( styles.hasOwnProperty( name ) ) {
            elem.style[name] = styles[name];
        }
    }
};

/**
* Function places an absolutely positioned
* element on top of the specified element
* copying position and dimensions.
*/
ss.copyLayout = function( from, to ) {
    "use strict";

    var box = ss.getBox( from );

    ss.addStyles( to, {
        position: 'absolute',
        left : box.left + 'px',
        top : box.top + 'px',
        width : from.offsetWidth + 'px',
        height : from.offsetHeight + 'px'
    });
};

/**
* Generates unique ID
* Complies with RFC 4122 version 4
* http://stackoverflow.com/a/2117523/1091949
* ID begins with letter "a" to be safe for HTML elem ID/name attr (can't start w/ number)
*/
ss.getUID = function() {
    "use strict";

    /*jshint bitwise: false*/
    return 'axxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(uidReplace, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

/**
* Removes white space from left and right of string
* Uses native String.trim if available
* Adapted from www.jquery.com
*/
var trim = "".trim;

ss.trim = trim && !trim.call("\uFEFF\xA0") ?
    function( text ) {
        return text === null ?
            "" :
            trim.call( text );
    } :
    function( text ) {
        return text === null ?
            "" :
            text.toString().replace( rLWhitespace, '' ).replace( rTWhitespace, '' );
    };

var arr = [];

ss.indexOf = arr.indexOf ?
    function( array, elem ) {
        return array.indexOf( elem );
    } :
    function( array, elem ) {
        for ( var i = 0, len = array.length; i < len; i++ ) {
            if ( array[i] === elem ) {
                return i;
            }
        }
        return -1;
    };

/**
* Extract file name from path
*/
ss.getFilename = function( path ) {
    "use strict";
    return path.replace( rPath, '' );
};

/**
* Get file extension
*/
ss.getExt = function( file ) {
    "use strict";
    return ( -1 !== file.indexOf( '.' ) ) ? file.replace( rExt, '' ) : '';
};

/**
* Checks whether an element is visible
*/
ss.isVisible = function( elem ) {
    "use strict";

    if ( elem.nodeType !== 1 || elem == document.body ) {
        elem = null;
        return true;
    }

    if ( elem.offsetWidth > 0 ||
         elem.offsetHeight > 0 ||
         ss.getStyle( elem, 'display' ).toLowerCase() != 'none' )
    {
        return ss.isVisible( elem.parentNode );
    }

    elem = null;
    return false;
};

ss.getStyle = function( elem, style ) {
    "use strict";

    if ( window.getComputedStyle ) {
        var cs = elem.ownerDocument.defaultView.getComputedStyle( elem, null );
        return cs.getPropertyValue( style );

    } else if ( elem.currentStyle && elem.currentStyle[ style ] ) {
        return elem.currentStyle[ style ];
    }
};

/**
* Accepts a form element and returns an object with key/value pairs for the form fields
*/
ss.getFormObj = function( form ) {
    "use strict";

    var elems = form.elements,
        ignore = ['button', 'submit', 'image', 'reset'],
        inputs = {},
        obj;

    for ( var i = 0, len = elems.length; i < len; i++ ) {
        obj = {};

        if ( elems[ i ].name && !elems[ i ].disabled && ss.indexOf( ignore, elems[ i ].type ) === -1 ) {
            if ( (elems[ i ].type == 'checkbox' || elems[ i ].type == 'radio') &&
                 !elems[ i ].checked )
            {
                continue;
            }

            obj[ elems[ i ].name ] = ss.val( elems[ i ] );
            ss.extendObj( inputs, obj );
        }
    }

    return inputs;
};

/**
* Accepts a form input element and returns its value
*/
ss.val = function( elem ) {
    "use strict";

    if ( !elem ) {
        return;
    }

    if ( elem.nodeName.toUpperCase() == 'SELECT' ) {
        var options = elem.options,
            index = elem.selectedIndex,
            one = elem.type === 'select-one' || index < 0,
            values = one ? null : [],
            value;

        for ( var i = 0, len = options.length; i < len; i++ ) {
            if ( ( options[ i ].selected || i === index ) && !options[ i ].disabled ) {
                value = !options[ i ].value ? options[ i ].text : options[ i ].value;

                if ( one ) {
                    return value;
                }

                values.push( value );
            }
        }

        return values;

    } else {
        return elem.value;
    }
};

/**
* Check whether element has a particular CSS class
* Parts borrowed from www.jquery.com
*/
ss.hasClass = function( elem, name ) {
    "use strict";

    if ( !elem || !name ) {
        return false;
    }

    return ( ' ' + elem.className + ' ' ).replace( rHasClass, ' ' ).indexOf( ' ' + name + ' ' ) >= 0;
};

/**
* Adds CSS class to an element
*/
ss.addClass = function( elem, name ) {
    "use strict";

    if ( !elem || !name ) {
        return false;
    }

    if ( !ss.hasClass( elem, name ) ) {
        elem.className += ' ' + name;
    }
};

/**
* Removes CSS class from an element
*/
ss.removeClass = (function() {
    "use strict";

    var c = {}; //cache regexps for performance

    return function( e, name ) {
        if ( !e || !name ) {
            return false;
        }

        if ( !c[name] ) {
            c[name] = new RegExp('(?:^|\\s)' + name + '(?!\\S)');
        }

        e.className = e.className.replace( c[name], '' );
    };
})();

/**
* Nulls out event handlers to prevent memory leaks in IE6/IE7
* http://javascript.crockford.com/memory/leak.html
* @param {Element} d
* @return void
*/
ss.purge = function( d ) {
    "use strict";

    var a = d.attributes, i, l, n;

    if ( a ) {
        for ( i = a.length - 1; i >= 0; i -= 1 ) {
            n = a[i].name;

            if ( typeof d[n] === 'function' ) {
                d[n] = null;
            }
        }
    }

    a = d.childNodes;

    if ( a ) {
        l = a.length;
        for ( i = 0; i < l; i += 1 ) {
            ss.purge( d.childNodes[i] );
        }
    }
};

/**
* Removes element from the DOM
*/
ss.remove = function( elem ) {
    "use strict";

    if ( elem && elem.parentNode ) {
        // null out event handlers for IE
        ss.purge( elem );
        elem.parentNode.removeChild( elem );
    }
    elem = null;
};

/**
* Accepts either a jQuery object, a string containing an element ID, or an element,
* verifies that it exists, and returns the element.
* @param {Mixed} elem
* @return {Element}
*/
ss.verifyElem = function( elem ) {
    "use strict";
    /*globals jQuery */

    if ( typeof jQuery !== 'undefined' && elem instanceof jQuery ) {
        elem = elem[0];

    } else if ( typeof elem === 'string' ) {
        if ( elem.charAt( 0 ) == '#' ) {
            elem = elem.substr( 1 );
        }
        elem = document.getElementById( elem );
    }

    if ( !elem || elem.nodeType !== 1 ) {
        return false;
    }

    if ( elem.nodeName.toUpperCase() == 'A' ) {
        elem.style.cursor = 'pointer';

        ss.addEvent( elem, 'click', function( e ) {
            if ( e && e.preventDefault ) {
                e.preventDefault();

            } else if ( window.event ) {
                window.event.returnValue = false;
            }
        });
    }

    return elem;
};

ss._options = {};

ss.uploadSetup = function( options ) {
    "use strict";
    ss.extendObj( ss._options, options );
};

ss.SimpleUpload = function( options ) {
    "use strict";

    this._opts = {
        button: '',
        url: '',
        dropzone: '',
        dragClass: '',
        form: '',
        overrideSubmit: true,
        cors: false,
        withCredentials: false,
        progressUrl: false,
        sessionProgressUrl: false,
        nginxProgressUrl: false,
        multiple: false,
        maxUploads: 3,
        queue: true,
        checkProgressInterval: 500,
        keyParamName: 'APC_UPLOAD_PROGRESS',
        sessionProgressName: 'PHP_SESSION_UPLOAD_PROGRESS',
        nginxProgressHeader: 'X-Progress-ID',
        customProgressHeaders: {},
        corsInputName: 'XHR_CORS_TARGETORIGIN',
        allowedExtensions: [],
        accept: '',
        maxSize: false,
        name: '',
        data: {},
        noParams: true,
        autoSubmit: true,
        multipart: true,
        method: 'POST',
        responseType: '',
        debug: false,
        hoverClass: '',
        focusClass: '',
        disabledClass: '',
        customHeaders: {},
        encodeHeaders: true,
        autoCalibrate: true,
        onBlankSubmit: function() {},
        onAbort: function( filename, uploadBtn, size ) {},
        onChange: function( filename, extension, uploadBtn, size, file ) {},
        onSubmit: function( filename, extension, uploadBtn, size ) {},
        onProgress: function( pct ) {},
        onUpdateFileSize: function( filesize ) {},
        onComplete: function( filename, response, uploadBtn, size ) {},
        onExtError: function( filename, extension ) {},
        onSizeError: function( filename, fileSize ) {},
        onError: function( filename, type, status, statusText, response, uploadBtn, size ) {},
        startXHR: function( filename, fileSize, uploadBtn ) {},
        endXHR: function( filename, fileSize, uploadBtn ) {},
        startNonXHR: function( filename, uploadBtn ) {},
        endNonXHR: function( filename, uploadBtn ) {}
    };

    ss.extendObj( this._opts, ss._options ); // Include any setup options
    ss.extendObj( this._opts, options ); // Then add options for this instance

    // An array of objects, each containing two items: a file and a reference
    // to the button which triggered the upload: { file: uploadFile, btn: button }
    this._queue = [];

    this._active = 0;
    this._disabled = false; // if disabled, clicking on button won't do anything
    this._maxFails = 10; // max allowed failed progress updates requests in iframe mode
    this._progKeys = {}; // contains the currently active upload ID progress keys
    this._sizeFlags = {}; // Cache progress keys after setting sizeBox for fewer trips to the DOM
    this._btns = [];

    this.addButton( this._opts.button );

    delete this._opts.button;
    this._opts.button = options = null;

    if ( this._opts.multiple === false ) {
        this._opts.maxUploads = 1;
    }

    if ( this._opts.dropzone !== '' ) {
        this.addDZ( this._opts.dropzone );
    }

    if ( this._opts.dropzone === '' && this._btns.length < 1 ) {
        throw new Error( "Invalid upload button. Make sure the element you're passing exists." );
    }

    if ( this._opts.form !== '' ) {
        this.setForm( this._opts.form );
    }

    this._createInput();
    this._manDisabled = false;
    this.enable( true );
};

ss.SimpleUpload.prototype = {

    destroy: function() {
        "use strict";

        // # of upload buttons
        var i = this._btns.length;

        // Put upload buttons back to the way we found them
        while ( i-- ) {
            // Remove event listener
            if ( this._btns[i].off ) {
                this._btns[i].off();
            }

            // Remove any lingering classes
            ss.removeClass( this._btns[i], this._opts.hoverClass );
            ss.removeClass( this._btns[i], this._opts.focusClass );
            ss.removeClass( this._btns[i], this._opts.disabledClass );

            // In case we disabled it
            this._btns[i].disabled = false;
        }

        this._killInput();

        // Set a flag to be checked in _last()
        this._destroy = true;
    },

    /**
    * Send data to browser console if debug is set to true
    */
    log: function( str ) {
        "use strict";

        if ( this._opts && this._opts.debug && window.console && window.console.log ) {
            window.console.log( '[Uploader] ' + str );
        }
    },

    /**
    * Replaces user data
    * Note that all previously set data is entirely removed and replaced
    */
    setData: function( data ) {
        "use strict";
        this._opts.data = data;
    },

    /**
    * Set or change uploader options
    * @param {Object} options
    */
    setOptions: function( options ) {
        "use strict";
        ss.extendObj( this._opts, options );
    },

    /**
    * Designate an element as an upload button
    */
    addButton: function( button ) {
        var btn;

        // An array of buttons was passed
        if ( button instanceof Array ) {

            for ( var i = 0, len = button.length; i < len; i++ ) {
                btn = ss.verifyElem( button[i] );

                if ( btn !== false ) {
                    this._btns.push( this.rerouteClicks( btn ) );

                } else {
                    this.log( 'Button with array index ' + i + ' is invalid' );
                }
            }

        // A single button was passed
        } else {
            btn = ss.verifyElem( button );

            if ( btn !== false ) {
                this._btns.push( this.rerouteClicks( btn ) );
            }
        }
    },

    /**
    * Designate an element as a drop zone
    */
    addDZ: function( dropzone ) {
        if ( !XhrOk ) {
            return;
        }

        dropzone = ss.verifyElem( dropzone );

        if ( !dropzone ) {
            this.log( 'Invalid or nonexistent element passed for drop zone' );
        } else {
            this.addDropZone( dropzone );
        }
    },

    /**
    * Designate an element as a progress bar
    * The CSS width % of the element will be updated as the upload progresses
    */
    setProgressBar: function( elem ) {
        "use strict";
        this._progBar = ss.verifyElem( elem );
    },

    /**
    * Designate an element to receive a string containing progress % during upload
    * Note: Uses innerHTML, so any existing child elements will be wiped out
    */
    setPctBox: function( elem ) {
        "use strict";
        this._pctBox = ss.verifyElem( elem );
    },

    /**
    * Designate an element to receive a string containing file size at start of upload
    * Note: Uses innerHTML, so any existing child elements will be wiped out
    */
    setFileSizeBox: function( elem ) {
        "use strict";
        this._sizeBox = ss.verifyElem( elem );
    },

    /**
    * Designate an element to be removed from DOM when upload is completed
    * Useful for removing progress bar, file size, etc. after upload
    */
    setProgressContainer: function( elem ) {
        "use strict";
        this._progBox = ss.verifyElem( elem );
    },

    /**
    * Designate an element to serve as the upload abort button
    */
    setAbortBtn: function( elem, remove ) {
        "use strict";

        this._abortBtn = ss.verifyElem( elem );
        this._removeAbort = false;

        if ( remove ) {
            this._removeAbort = true;
        }
    },

    setForm: function( form ) {
        "use strict";

        this._form = ss.verifyElem( form );

        if ( !this._form || this._form.nodeName.toUpperCase() != 'FORM' ) {
            this.log( 'Invalid or nonexistent element passed for form' );

        } else {
            var self = this;
            this._opts.autoSubmit = false;

            if ( this._opts.overrideSubmit ) {
                ss.addEvent( this._form, 'submit', function( e ) {
                    if ( e.preventDefault ) {
                        e.preventDefault();

                    } else if ( window.event ) {
                        window.event.returnValue = false;
                    }

                    if ( self._validateForm() ) {
                        self.submit();
                    }
                });

                this._form.submit = function() {
                    if ( self._validateForm() ) {
                        self.submit();
                    }
                };
            }
        }
    },

    /**
    * Returns number of files currently in queue
    */
    getQueueSize: function() {
        "use strict";
        return this._queue.length;
    },

    /**
    * Remove current file from upload queue, reset props, cycle to next upload
    */
    removeCurrent: function( id ) {
        "use strict";

        if ( id ) {
            var i = this._queue.length;

            while ( i-- ) {
                if ( this._queue[i].id === id ) {
                    this._queue.splice( i, 1 );
                    break;
                }
            }

        } else {
            this._queue.splice( 0, 1 );
        }

        this._cycleQueue();
    },

    /**
    * Clears Queue so only most recent select file is uploaded
    */
    clearQueue: function() {
        "use strict";
        this._queue.length = 0;
    },

    /**
    * Disables upload functionality
    */
    disable: function( _self ) {
        "use strict";

        var i = this._btns.length,
            nodeName;

        // _self is always true when disable() is called internally
        this._manDisabled = !_self || this._manDisabled === true ? true : false;
        this._disabled = true;

        while ( i-- ) {
            nodeName = this._btns[i].nodeName.toUpperCase();

            if ( nodeName == 'INPUT' || nodeName == 'BUTTON' ) {
                this._btns[i].disabled = true;
            }

            if ( this._opts.disabledClass !== '' ) {
                ss.addClass( this._btns[i], this._opts.disabledClass );
            }
        }

        // Hide file input
        if ( this._input && this._input.parentNode ) {
            this._input.parentNode.style.visibility = 'hidden';
        }
    },

    /**
    * Enables upload functionality
    */
    enable: function( _self ) {
        "use strict";

        // _self will always be true when enable() is called internally
        if ( !_self ) {
            this._manDisabled = false;
        }

        // Don't enable uploader if it was manually disabled
        if ( this._manDisabled === true ) {
            return;
        }

        var i = this._btns.length;

        this._disabled = false;

        while ( i-- ) {
            ss.removeClass( this._btns[i], this._opts.disabledClass );
            this._btns[i].disabled = false;
        }
    },

    /**
     * Updates invisible button position
     */
    updatePosition: function( btn ) {
        "use strict";

        btn = !btn ? this._btns[0] : btn;

        if ( btn && this._input && this._input.parentNode ) {
            ss.copyLayout( btn, this._input.parentNode );
        }

        btn = null;
    },

    rerouteClicks: function( elem ) {
        "use strict";

        var self = this;

        // ss.addEvent() returns a function to detach, which
        // allows us to call elem.off() to remove mouseover listener
        elem.off = ss.addEvent( elem, 'mouseover', function() {
            if ( self._disabled ) {
                return;
            }

            if ( !self._input ) {
                self._createInput();
            }

            self._overBtn = elem;
            ss.copyLayout( elem, self._input.parentNode );
            self._input.parentNode.style.visibility = 'visible';
        });

        if ( self._opts.autoCalibrate && !ss.isVisible( elem ) ) {
            self.log('Upload button not visible');

            var interval = function() {
                if ( ss.isVisible( elem ) ) {
                    self.log('Upload button now visible');

                    window.setTimeout(function() {
                        self.updatePosition( elem );

                        if ( self._btns.length === 1 ) {
                            self._input.parentNode.style.visibility = 'hidden';
                        }
                    }, 200);

                } else {
                    window.setTimeout( interval, 500 );
                }
            };

            window.setTimeout( interval, 500 );
        }

        return elem;
    },

    /**
    * Validates input and directs to either XHR method or iFrame method
    */
    submit: function( _, auto ) {
        "use strict";

        if ( !auto && this._queue.length < 1 ) {
            this._opts.onBlankSubmit.call( this );
            return;
        }

        if ( this._disabled ||
            this._active >= this._opts.maxUploads ||
            this._queue.length < 1 )
        {
            return;
        }

        if ( !this._checkFile( this._queue[0] ) ) {
            return;
        }

        // User returned false to cancel upload
        if ( false === this._opts.onSubmit.call( this, this._queue[0].name, this._queue[0].ext, this._queue[0].btn, this._queue[0].size ) ) {
            return;
        }

        // Increment the active upload counter
        this._active++;

        // Disable uploading if multiple file uploads are not enabled
        // or if queue is disabled and we've reached max uploads
        if ( this._opts.multiple === false ||
            this._opts.queue === false && this._active >= this._opts.maxUploads )
        {
            this.disable( true );
        }

        this._initUpload( this._queue[0] );
    }

};

ss.IframeUpload = {

    _detachEvents: {},

    _detach: function( id ) {
        if ( this._detachEvents[ id ] ) {
            this._detachEvents[ id ]();
            delete this._detachEvents[ id ];
        }
    },

    /**
    * Accepts a URI string and returns the hostname
    */
    _getHost: function( uri ) {
        var a = document.createElement( 'a' );

        a.href = uri;

        if ( a.hostname ) {
            return a.hostname.toLowerCase();
        }
        return uri;
    },

    _addFiles: function( file ) {
        var filename = ss.getFilename( file.value ),
            ext = ss.getExt( filename );

        if ( false === this._opts.onChange.call( this, filename, ext, this._overBtn, undefined, file ) ) {
            return false;
        }

        this._queue.push({
            id: ss.getUID(),
            file: file,
            name: filename,
            ext: ext,
            btn: this._overBtn,
            size: null
        });

        return true;
    },

    /**
    * Handles uploading with iFrame
    */
    _uploadIframe: function( fileObj, progBox, sizeBox, progBar, pctBox, abortBtn, removeAbort ) {
        "use strict";

        var self = this,
            opts = this._opts,
            key = ss.getUID(),
            iframe = ss.getIFrame(),
            form,
            url,
            msgLoaded = false,
            iframeLoaded = false,
            cancel;

        if ( opts.noParams === true ) {
            url = opts.url;

        } else {
            // If we're using Nginx Upload Progress Module, append upload key to the URL
            // Also, preserve query string if there is one
            url = !opts.nginxProgressUrl ?
                    opts.url :
                    url + ( ( url.indexOf( '?' ) > -1 ) ? '&' : '?' ) +
                          encodeURIComponent( opts.nginxProgressHeader ) + '=' + encodeURIComponent( key );
        }

        form = ss.getForm({
            action: url,
            target: iframe.name,
            method: opts.method
        });

        opts.onProgress.call( this, 0 );

        if ( pctBox ) {
            pctBox.innerHTML = '0%';
        }

        if ( progBar ) {
            progBar.style.width = '0%';
        }

        // For CORS, add a listener for the "message" event, which will be
        // triggered by the Javascript snippet in the server response
        if ( opts.cors ) {
            var msgId = ss.getUID();

            self._detachEvents[ msgId ] = ss.addEvent( window, 'message', function( event ) {
                // Make sure event.origin matches the upload URL
                if ( self._getHost( event.origin ) != self._getHost( opts.url ) ) {
                    self.log('Non-matching origin: ' + event.origin);
                    return;
                }

                msgLoaded = true;
                self._detach( msgId );
                opts.endNonXHR.call( self, fileObj.name, fileObj.btn );
                self._finish( fileObj,  '', '', event.data, sizeBox, progBox, pctBox, abortBtn, removeAbort );
            });
        }

        self._detachEvents[ iframe.id ] = ss.addEvent( iframe, 'load', function() {
            self._detach( iframe.id );

            if ( opts.sessionProgressUrl ) {
                form.appendChild( ss.getHidden( opts.sessionProgressName, key ) );
            }

            // PHP APC upload progress key field must come before the file field
            else if ( opts.progressUrl ) {
                form.appendChild( ss.getHidden( opts.keyParamName, key ) );
            }

            if ( self._form ) {
                ss.extendObj( opts.data, ss.getFormObj( self._form ) );
            }

            // Get additional data after startNonXHR() in case setData() was called prior to submitting
            for ( var prop in opts.data ) {
                if ( opts.data.hasOwnProperty( prop ) ) {
                    form.appendChild( ss.getHidden( prop, opts.data[prop] ) );
                }
            }

            // Add a field (default name: "XHR_CORS_TRARGETORIGIN") to tell server this is a CORS request
            // Value of the field is targetOrigin parameter of postMessage(message, targetOrigin)
            if ( opts.cors ) {
                form.appendChild( ss.getHidden( opts.corsInputName, window.location.href ) );
            }

            form.appendChild( fileObj.file );

            self._detachEvents[ fileObj.id ] = ss.addEvent( iframe, 'load', function() {
                if ( !iframe || !iframe.parentNode || iframeLoaded ) {
                    return;
                }

                self._detach( fileObj.id );
                iframeLoaded = true;

                delete self._progKeys[ key ];
                delete self._sizeFlags[ key ];

                if ( abortBtn ) {
                    ss.removeEvent( abortBtn, 'click', cancel );
                }

                // After a CORS response, we wait briefly for the "message" event to finish,
                // during which time the msgLoaded var will be set to true, signalling success.
                // If iframe loads without "message" event, we assume there was an error
                if ( opts.cors ) {
                    window.setTimeout(function() {
                        ss.remove( iframe );

                        // If msgLoaded has not been set to true after "message" event fires, we
                        // infer that an error must have occurred and respond accordingly
                        if ( !msgLoaded ) {
                            self._errorFinish( fileObj, '', '', false, 'error', progBox, sizeBox, pctBox, abortBtn, removeAbort );
                        }

                        fileObj = opts = key = iframe = sizeBox = progBox = pctBox = abortBtn = removeAbort = null;
                    }, 600);
                }

                // Non-CORS upload
                else {
                    try {
                        var doc = iframe.contentDocument ? iframe.contentDocument : iframe.contentWindow.document,
                            response = doc.body.innerHTML;

                        ss.remove( iframe );
                        iframe = null;

                        opts.endNonXHR.call( self, fileObj.name, fileObj.btn );

                        // No way to get status and statusText for an iframe so return empty strings
                        self._finish( fileObj, '', '', response, sizeBox, progBox, pctBox, abortBtn, removeAbort );

                    } catch ( e ) {
                        self._errorFinish( fileObj, '', e.message, false, 'error', progBox, sizeBox, pctBox, abortBtn, removeAbort );
                    }

                    fileObj = opts = key = sizeBox = progBox = pctBox = null;
                }
            });// end load

            if ( abortBtn ) {
                cancel = function() {
                    ss.removeEvent( abortBtn, 'click', cancel );

                    delete self._progKeys[key];
                    delete self._sizeFlags[key];

                    if ( iframe ) {
                        iframeLoaded = true;
                        self._detach( fileObj.id );

                        try {
                            if ( iframe.contentWindow.document.execCommand ) {
                                iframe.contentWindow.document.execCommand('Stop');
                            }
                        } catch( err ) {}

                        try {
                            iframe.src = 'javascript'.concat(':false;');
                        } catch( err ) {}

                        window.setTimeout(function() {
                            ss.remove( iframe );
                            iframe = null;
                        }, 1);
                    }

                    self.log('Upload aborted');
                    opts.onAbort.call( self, fileObj.name, fileObj.btn, fileObj.size );
                    self._last( sizeBox, progBox, pctBox, abortBtn, removeAbort );
                };

                ss.addEvent( abortBtn, 'click', cancel );
            }

            self.log( 'Commencing upload using iframe' );
            form.submit();

            // Remove form and begin next upload
            window.setTimeout(function() {
                ss.remove( form );
                form = null;
                self.removeCurrent( fileObj.id );
            }, 1);

            if ( self._hasProgUrl ) {
                // Add progress key to active key array
                self._progKeys[key] = 1;

                window.setTimeout( function() {
                    self._getProg( key, progBar, sizeBox, pctBox, 1 );
                    progBar = sizeBox = pctBox = null;
                }, 600 );
            }

        });// end load

        document.body.appendChild( form );
        document.body.appendChild( iframe );
    },

    /**
    * Retrieves upload progress updates from the server
    * (For fallback upload progress support)
    */
    _getProg: function( key, progBar, sizeBox, pctBox, counter ) {
        "use strict";

        var self = this,
            opts = this._opts,
            time = new Date().getTime(),
            xhr,
            url,
            callback;

        if ( !key ) {
            return;
        }

        // Nginx Upload Progress Module
        if ( opts.nginxProgressUrl ) {
            url = opts.nginxProgressUrl + '?' +
                  encodeURIComponent( opts.nginxProgressHeader ) + '=' + encodeURIComponent( key ) +
                  '&_=' + time;
        }

        else if ( opts.sessionProgressUrl ) {
            url = opts.sessionProgressUrl;
        }

        // PHP APC upload progress
        else if ( opts.progressUrl ) {
            url = opts.progressUrl +
            '?progresskey=' + encodeURIComponent( key ) +
            '&_=' + time;
        }

        callback = function() {
            var response,
                size,
                pct,
                status,
                statusText;

            try {
                // XDR doesn't have readyState so we just assume that it finished correctly
                if ( callback && ( opts.cors || xhr.readyState === 4 ) ) {
                    callback = undefined;
                    xhr.onreadystatechange = function() {};

                    try {
                        statusText = xhr.statusText;
                        status = xhr.status;
                    } catch( e ) {
                        statusText = '';
                        status = '';
                    }

                    // XDR also doesn't have status, so just assume that everything is fine
                    if ( opts.cors || ( status >= 200 && status < 300 ) ) {
                        response = ss.parseJSON( xhr.responseText );

                        if ( response === false ) {
                            self.log( 'Error parsing progress response (expecting JSON)' );
                            return;
                        }

                        // Handle response if using Nginx Upload Progress Module
                        if ( opts.nginxProgressUrl ) {

                            if ( response.state == 'uploading' ) {
                                size = parseInt( response.size, 10 );
                                if ( size > 0 ) {
                                    pct = Math.round( ( parseInt( response.received, 10 ) / size ) * 100 );
                                    size = Math.round( size / 1024 ); // convert to kilobytes
                                }

                            } else if ( response.state == 'done' ) {
                                pct = 100;

                            } else if ( response.state == 'error' ) {
                                self.log( 'Error requesting upload progress: ' + response.status );
                                return;
                            }
                        }

                        // Handle response if using PHP APC
                        else if ( opts.sessionProgressUrl || opts.progressUrl ) {
                            if ( response.success === true ) {
                                size = parseInt( response.size, 10 );
                                pct = parseInt( response.pct, 10 );
                            }
                        }

                        // Update progress bar width
                        if ( pct ) {
                            if ( pctBox ) {
                                pctBox.innerHTML = pct + '%';
                            }

                            if ( progBar ) {
                                progBar.style.width = pct + '%';
                            }

                            opts.onProgress.call( self, pct );
                        }

                        if ( size && !self._sizeFlags[key] ) {
                            if ( sizeBox ) {
                                sizeBox.innerHTML = size + 'K';
                            }

                            self._sizeFlags[key] = 1;
                            opts.onUpdateFileSize.call( self, size );
                        }

                        // Stop attempting progress checks if we keep failing
                        if ( !pct &&
                             !size &&
                             counter >= self._maxFails )
                        {
                            counter++;
                            self.log( 'Failed progress request limit reached. Count: ' + counter );
                            return;
                        }

                        // Begin countdown until next progress update check
                        if ( pct < 100 && self._progKeys[key] ) {
                            window.setTimeout( function() {
                                self._getProg( key, progBar, sizeBox, pctBox, counter );

                                key = progBar = sizeBox = pctBox = counter = null;
                            }, opts.checkProgressInterval );
                        }

                        // We didn't get a 2xx status so don't continue sending requests
                    } else {
                        delete self._progKeys[key];
                        self.log( 'Error requesting upload progress: ' + status + ' ' + statusText );
                    }

                    xhr = size = pct = status = statusText = response = null;
                }

            } catch( e ) {
                self.log( 'Error requesting upload progress: ' + e.message );
            }
        };

        // CORS requests in IE8 and IE9 must use XDomainRequest
        if ( opts.cors && !opts.sessionProgressUrl ) {

            if ( window.XDomainRequest ) {
                xhr = new window.XDomainRequest();
                xhr.open( 'GET', url, true );
                xhr.onprogress = xhr.ontimeout = function() {};
                xhr.onload = callback;

                xhr.onerror = function() {
                    delete self._progKeys[key];
                    key = null;
                    self.log('Error requesting upload progress');
                };

                // IE7 or some other dinosaur -- just give up
            } else {
                return;
            }

        } else {
            var method = !opts.sessionProgressUrl ? 'GET' : 'POST',
                headers = {},
                params;

            xhr = ss.newXHR();
            xhr.onreadystatechange = callback;
            xhr.open( method, url, true );

            // PHP session progress updates must be a POST request
            if ( opts.sessionProgressUrl ) {
                params = encodeURIComponent( opts.sessionProgressName ) + '=' + encodeURIComponent( key );
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }

            // Set the upload progress header for Nginx
            if ( opts.nginxProgressUrl ) {
                headers[opts.nginxProgressHeader] = key;
            }

            headers['X-Requested-With'] = 'XMLHttpRequest';
            headers['Accept'] = 'application/json, text/javascript, */*; q=0.01';

            ss.extendObj( headers, opts.customProgressHeaders );

            for ( var i in headers ) {
                if ( headers.hasOwnProperty( i ) ) {
                    if ( opts.encodeHeaders ) {
                        xhr.setRequestHeader( i, ss.encodeUTF8( headers[ i ] + '' ) );

                    } else {
                        xhr.setRequestHeader( i, headers[ i ] + '' );
                    }
                }
            }

           xhr.send( ( opts.sessionProgressUrl &&  params ) || null );
        }
    },

    _initUpload: function( fileObj ) {
        if ( false === this._opts.startNonXHR.call( this, fileObj.name, fileObj.btn ) ) {

            if ( this._disabled ) {
                this.enable( true );
            }

            this._active--;
            return;
        }

        this._hasProgUrl = ( this._opts.progressUrl ||
                             this._opts.sessionProgressUrl ||
                             this._opts.nginxProgressUrl ) ?
                             true : false;

        this._uploadIframe( fileObj, this._progBox, this._sizeBox, this._progBar, this._pctBox, this._abortBtn, this._removeAbort );

        fileObj = this._progBox = this._sizeBox = this._progBar = this._pctBox = this._abortBtn = this._removeAbort = null;
    }
};

ss.XhrUpload = {

    _addFiles: function( files ) {
        var total = files.length,
            filename,
            ext,
            size,
            i;

        if ( !this._opts.multiple ) {
            total = 1;
        }

        for ( i = 0; i < total; i++ ) {
            filename = ss.getFilename( files[i].name );
            ext = ss.getExt( filename );
            size = Math.round( files[i].size / 1024 );

            if ( false === this._opts.onChange.call( this, filename, ext, this._overBtn, size, files[i] ) ) {
                return false;
            }

            this._queue.push({
                id: ss.getUID(),
                file: files[i],
                name: filename,
                ext: ext,
                btn: this._overBtn,
                size: size
            });
        }

        return true;
    },

    /**
    * Handles uploading with XHR
    */
    _uploadXhr: function( fileObj, url, params, headers, sizeBox, progBar, progBox, pctBox, abortBtn, removeAbort ) {
        "use strict";

        var self = this,
            opts = this._opts,
            xhr = ss.newXHR(),
            callback,
            cancel;

        // Inject file size into size box
        if ( sizeBox ) {
            sizeBox.innerHTML = fileObj.size + 'K';
        }

        // Begin progress bars at 0%
        if ( pctBox ) {
            pctBox.innerHTML = '0%';
        }

        if ( progBar ) {
            progBar.style.width = '0%';
        }

        // Borrows heavily from jQuery ajax transport
        callback = function( _, isAbort ) {
            var statusText;

            try {
                // Was never called and is aborted or complete
                if ( callback && ( isAbort || xhr.readyState === 4 ) ) {
                    callback = undefined;
                    xhr.onreadystatechange = function() {};

                    // If it's an abort
                    if ( isAbort ) {
                        // Abort it manually if needed
                        if ( xhr.readyState !== 4 ) {
                            xhr.abort();
                        }

                        opts.onAbort.call( self, fileObj.name, fileObj.btn, fileObj.size );
                        self._last( sizeBox, progBox, pctBox, abortBtn, removeAbort );

                    } else {
                        if ( abortBtn ) {
                            ss.removeEvent( abortBtn, 'click', cancel );
                        }

                        try {
                            statusText = xhr.statusText;
                        } catch( e ) {
                            // We normalize with Webkit giving an empty statusText
                            statusText = '';
                        }

                        if ( xhr.status >= 200 && xhr.status < 300 ) {
                            opts.endXHR.call( self, fileObj.name, fileObj.size, fileObj.btn );
                            self._finish( fileObj, xhr.status, statusText, xhr.responseText, sizeBox, progBox, pctBox, abortBtn, removeAbort );

                            // We didn't get a 2xx status so throw an error
                        } else {
                            self._errorFinish( fileObj, xhr.status, statusText, xhr.responseText, 'error', progBox, sizeBox, pctBox, abortBtn, removeAbort );
                        }
                    }
                }

            }
            catch ( e ) {
                if ( !isAbort ) {
                    self._errorFinish( fileObj, -1, e.message, false, 'error', progBox, sizeBox, pctBox, abortBtn, removeAbort );
                }
            }
        };

        if ( abortBtn ) {
            cancel = function() {
                ss.removeEvent( abortBtn, 'click', cancel );

                if ( callback ) {
                    callback( undefined, true );
                }
            };

            ss.addEvent( abortBtn, 'click', cancel );
        }

        xhr.onreadystatechange = callback;
        xhr.open( opts.method.toUpperCase(), url, true );
        xhr.withCredentials = !!opts.withCredentials;

        ss.extendObj( headers, opts.customHeaders );

        for ( var i in headers ) {
            if ( headers.hasOwnProperty( i ) ) {
                if ( opts.encodeHeaders ) {
                    xhr.setRequestHeader( i, ss.encodeUTF8( headers[ i ] + '' ) );

                } else {
                    xhr.setRequestHeader( i, headers[ i ] + '' );
                }
            }
        }

        ss.addEvent( xhr.upload, 'progress', function( event ) {
            if ( event.lengthComputable ) {
                var pct = Math.round( event.loaded / event.total * 100 );

                opts.onProgress.call( self, pct );

                if ( pctBox ) {
                    pctBox.innerHTML = pct + '%';
                }

                if ( progBar ) {
                    progBar.style.width = pct + '%';
                }
            }
        });

        opts.onProgress.call( this, 0 );

        if ( opts.multipart === true ) {
            var formData = new FormData();

            for ( var prop in params ) {
                if ( params.hasOwnProperty( prop ) ) {
                    formData.append( prop, params[prop] );
                }
            }

            formData.append( opts.name, fileObj.file );
            this.log( 'Commencing upload using multipart form' );
            xhr.send( formData );

        } else {
            this.log( 'Commencing upload using binary stream' );
            xhr.send( fileObj.file );
        }

        // Remove file from upload queue and begin next upload
        this.removeCurrent( fileObj.id );
    },

    _initUpload: function( fileObj ) {
        "use strict";

        var params = {},
            headers = {},
            url;

        // Call the startXHR() callback and stop upload if it returns false
        // We call it before _uploadXhr() in case setProgressBar, setPctBox, etc., is called
        if ( false === this._opts.startXHR.call( this, fileObj.name, fileObj.size, fileObj.btn ) ) {

            if ( this._disabled ) {
                this.enable( true );
            }

            this._active--;
            return;
        }

        params[this._opts.name] = fileObj.name;

        headers['X-Requested-With'] = 'XMLHttpRequest';
        headers['X-File-Name'] = fileObj.name;

        if ( this._opts.responseType.toLowerCase() == 'json' ) {
            headers['Accept'] = 'application/json, text/javascript, */*; q=0.01';
        }

        if ( !this._opts.multipart ) {
            headers['Content-Type'] = 'application/octet-stream';
        }

        if ( this._form ) {
            ss.extendObj( params, ss.getFormObj( this._form ) );
        }

        // We get the any additional data here after startXHR()
        ss.extendObj( params, this._opts.data );

        // Build query string while preserving any existing parameters
        url = this._opts.noParams === true ?
                this._opts.url :
                this._opts.url + ( ( this._opts.url.indexOf( '?' ) > -1 ) ? '&' : '?' ) + ss.obj2string( params );

        this._uploadXhr( fileObj, url, params, headers, this._sizeBox, this._progBar, this._progBox, this._pctBox, this._abortBtn, this._removeAbort );

        this._sizeBox = this._progBar = this._progBox = this._pctBox = this._abortBtn = this._removeAbort = null;
    }

};

ss.DragAndDrop = {

    _dragFileCheck: function( e ) {
        if ( e.dataTransfer.types ) {
            for ( var i = 0; i < e.dataTransfer.types.length; i++ ) {
                if ( e.dataTransfer.types[i] == 'Files' ) {
                    return true;
                }
            }
        }

        return false;
    },

    addDropZone: function( elem ) {
        var self = this;

        ss.addStyles( elem, {
            'zIndex': 16777271
        });

        elem.ondragenter = function( e ) {
            e.stopPropagation();
            e.preventDefault();

            if ( !self._dragFileCheck( e ) ) {
                return false;
            }

            ss.addClass( this, self._opts.dragClass );
            return false;
        };

        elem.ondragover = function( e ) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        };

        elem.ondragend = function() {
            ss.removeClass( this, self._opts.dragClass );
            return false;
        };

        elem.ondragleave = function() {
            ss.removeClass( this, self._opts.dragClass );
            return false;
        };

        elem.ondrop = function( e ) {
            e.stopPropagation();
            e.preventDefault();

            ss.removeClass( this, self._opts.dragClass );

            if ( !self._dragFileCheck( e ) ) {
                return;
            }

            if ( false !== self._addFiles( e.dataTransfer.files ) ) {
                self._cycleQueue();
            }
        };
    }
};

ss.extendObj( ss.SimpleUpload.prototype, {

    _createInput: function() {
        "use strict";

        var self = this,
            div = document.createElement( 'div' );

        this._input = document.createElement( 'input' );
        this._input.type = 'file';
        this._input.name = this._opts.name;

        // Don't allow multiple file selection in Safari -- it has a nasty bug
        // http://stackoverflow.com/q/7231054/1091949
        if ( XhrOk && !isSafari && this._opts.multiple ) {
            this._input.multiple = true;
        }

        // Check support for file input accept attribute
        if ( 'accept' in this._input && this._opts.accept !== '' ) {
            this._input.accept = this._opts.accept;
        }

        ss.addStyles( div, {
            'display' : 'block',
            'position' : 'absolute',
            'overflow' : 'hidden',
            'margin' : 0,
            'padding' : 0,
            'opacity' : 0,
            'direction' : 'ltr',
            'zIndex': 16777270
        });

        if ( div.style.opacity !== '0' ) {
            div.style.filter = 'alpha(opacity=0)';
        }

        ss.addStyles( this._input, {
            'position' : 'absolute',
            'right' : 0,
            'margin' : 0,
            'padding' : 0,
            'fontSize' : '480px',
            'fontFamily' : 'sans-serif',
            'cursor' : 'pointer',
            'height' : '100%',
            'zIndex': 16777270
        });

        this._input.turnOff = ss.addEvent( this._input, 'change', function() {
            if ( !self._input || self._input.value === '' ) {
                return;
            }

            if ( false === self._addFiles( XhrOk ? self._input.files : self._input ) ) {
                return;
            }

            ss.removeClass( self._overBtn, self._opts.hoverClass );
            ss.removeClass( self._overBtn, self._opts.focusClass );

            self._killInput();

            // Then create a new file input
            self._createInput();

            // Submit if autoSubmit option is true
            if ( self._opts.autoSubmit ) {
                self.submit();
            }
        });

        if ( self._opts.hoverClass !== '' ) {
            div.mouseOverOff = ss.addEvent( div, 'mouseover', function() {
                ss.addClass( self._overBtn, self._opts.hoverClass );
            });
        }

        div.mouseOutOff = ss.addEvent( div, 'mouseout', function() {
            self._input.parentNode.style.visibility = 'hidden';

            if ( self._opts.hoverClass !== '' ) {
                ss.removeClass( self._overBtn, self._opts.hoverClass );
                ss.removeClass( self._overBtn, self._opts.focusClass );
            }
        });

        if ( self._opts.focusClass !== '' ) {
            this._input.focusOff = ss.addEvent( this._input, 'focus', function() {
                ss.addClass( self._overBtn, self._opts.focusClass );
            });

            this._input.blurOff = ss.addEvent( this._input, 'blur', function() {
                ss.removeClass( self._overBtn, self._opts.focusClass );
            });
        }

        div.appendChild( this._input );
        document.body.appendChild( div );
        div = null;
    },

    /**
    * Final cleanup function after upload ends
    */
    _last: function( sizeBox, progBox, pctBox, abortBtn, removeAbort ) {
        "use strict";

        if ( sizeBox ) {
           sizeBox.innerHTML = '';
        }

        if ( pctBox ) {
            pctBox.innerHTML = '';
        }

        if ( abortBtn && removeAbort ) {
            ss.remove( abortBtn );
        }

        if ( progBox ) {
            ss.remove( progBox );
        }

        // Decrement the active upload counter
        this._active--;

        sizeBox = progBox = pctBox = abortBtn = removeAbort = null;

        if ( this._disabled ) {
            this.enable( true );
        }

        // Burn it all down if destroy() was called
        // We have to do it here after everything is finished to avoid any errors
        if ( this._destroy &&
             this._queue.length === 0 &&
             this._active.length === 0 )
        {
            for ( var prop in this ) {
                if ( this.hasOwnProperty( prop ) ) {
                    delete this[ prop ];
                }
            }

        // Otherwise just go to the next upload as usual
        } else {
            this._cycleQueue();
        }
    },

    /**
    * Completes upload request if an error is detected
    */
    _errorFinish: function( fileObj, status, statusText, response, errorType, progBox, sizeBox, pctBox, abortBtn, removeAbort ) {
        "use strict";

        this.log( 'Upload failed: ' + status + ' ' + statusText );
        this._opts.onError.call( this, fileObj.name, errorType, status, statusText, response, fileObj.btn, fileObj.size );
        this._last( sizeBox, progBox, pctBox, abortBtn, removeAbort );

        fileObj = status = statusText = response = errorType = sizeBox = progBox = pctBox = abortBtn = removeAbort = null;
    },

    /**
    * Completes upload request if the transfer was successful
    */
    _finish: function( fileObj, status, statusText, response, sizeBox, progBox, pctBox, abortBtn, removeAbort ) {
        "use strict";

        this.log( 'Server response: ' + response );

        if ( this._opts.responseType.toLowerCase() == 'json' ) {
            response = ss.parseJSON( response );

            if ( response === false ) {
                this._errorFinish( fileObj, status, statusText, false, 'parseerror', progBox, sizeBox, abortBtn, removeAbort );
                return;
            }
        }

        this._opts.onComplete.call( this, fileObj.name, response, fileObj.btn, fileObj.size );
        this._last( sizeBox, progBox, pctBox, abortBtn, removeAbort );
        fileObj = status = statusText = response = sizeBox = progBox = pctBox = abortBtn = removeAbort = null;
    },

    /**
    * Verifies that file is allowed
    * Checks file extension and file size if limits are set
    */
    _checkFile: function( fileObj ) {
        "use strict";

        var extOk = false,
            i = this._opts.allowedExtensions.length;

        // Only file extension if allowedExtensions is set
        if ( i > 0 ) {
            while ( i-- ) {
                if ( this._opts.allowedExtensions[i].toLowerCase() == fileObj.ext.toLowerCase() ) {
                    extOk = true;
                    break;
                }
            }

            if ( !extOk ) {
                this.removeCurrent( fileObj.id );
                this.log( 'File extension not permitted' );
                this._opts.onExtError.call( this, fileObj.name, fileObj.ext );
                return false;
            }
        }

        if ( fileObj.size &&
            this._opts.maxSize !== false &&
            fileObj.size > this._opts.maxSize )
        {
            this.removeCurrent( fileObj.id );
            this.log( fileObj.name + ' exceeds ' + this._opts.maxSize + 'K limit' );
            this._opts.onSizeError.call( this, fileObj.name, fileObj.size );
            return false;
        }

        fileObj = null;

        return true;
    },

    _killInput: function() {
        "use strict";

        if ( !this._input ) {
            return;
        }

        if ( this._input.turnOff ) {
            this._input.turnOff();
        }

        if ( this._input.focusOff ) {
            this._input.focusOff();
        }

        if ( this._input.blurOff ) {
            this._input.blurOff();
        }

        if ( this._input.parentNode.mouseOverOff ) {
            this._input.parentNode.mouseOverOff();
        }

        ss.remove( this._input.parentNode );
        delete this._input;
        this._input = null;
    },

    /**
    * Enables uploader and submits next file for upload
    */
    _cycleQueue: function() {
        "use strict";

        if ( this._queue.length > 0 && this._opts.autoSubmit ) {
            this.submit( undefined, true );
        }
    },

    _validateForm: function() {
        "use strict";

        if ( this._form.checkValidity && !this._form.checkValidity() ) {
            return false;

        } else {
            return true;
        }
    }

});

if ( XhrOk ) {
    ss.extendObj( ss.SimpleUpload.prototype, ss.XhrUpload );

} else {
    ss.extendObj( ss.SimpleUpload.prototype, ss.IframeUpload );
}

ss.extendObj( ss.SimpleUpload.prototype, ss.DragAndDrop );

return ss;

}));
;
/*! Sortable 1.2.1 - MIT | git://github.com/rubaxa/Sortable.git */
!function(a){"use strict";"function"==typeof define&&define.amd?define(a):"undefined"!=typeof module&&"undefined"!=typeof module.exports?module.exports=a():"undefined"!=typeof Package?Sortable=a():window.Sortable=a()}(function(){"use strict";function a(a,b){this.el=a,this.options=b=s({},b),a[J]=this;var d={group:Math.random(),sort:!0,disabled:!1,store:null,handle:null,scroll:!0,scrollSensitivity:30,scrollSpeed:10,draggable:/[uo]l/i.test(a.nodeName)?"li":">*",ghostClass:"sortable-ghost",ignore:"a, img",filter:null,animation:0,setData:function(a,b){a.setData("Text",b.textContent)},dropBubble:!1,dragoverBubble:!1,dataIdAttr:"data-id",delay:0};for(var e in d)!(e in b)&&(b[e]=d[e]);var g=b.group;g&&"object"==typeof g||(g=b.group={name:g}),["pull","put"].forEach(function(a){a in g||(g[a]=!0)}),b.groups=" "+g.name+(g.put.join?" "+g.put.join(" "):"")+" ";for(var h in this)"_"===h.charAt(0)&&(this[h]=c(this,this[h]));f(a,"mousedown",this._onTapStart),f(a,"touchstart",this._onTapStart),f(a,"dragover",this),f(a,"dragenter",this),R.push(this._onDragOver),b.store&&this.sort(b.store.get(this))}function b(a){v&&v.state!==a&&(i(v,"display",a?"none":""),!a&&v.state&&w.insertBefore(v,t),v.state=a)}function c(a,b){var c=Q.call(arguments,2);return b.bind?b.bind.apply(b,[a].concat(c)):function(){return b.apply(a,c.concat(Q.call(arguments)))}}function d(a,b,c){if(a){c=c||L,b=b.split(".");var d=b.shift().toUpperCase(),e=new RegExp("\\s("+b.join("|")+")(?=\\s)","g");do if(">*"===d&&a.parentNode===c||(""===d||a.nodeName.toUpperCase()==d)&&(!b.length||((" "+a.className+" ").match(e)||[]).length==b.length))return a;while(a!==c&&(a=a.parentNode))}return null}function e(a){a.dataTransfer.dropEffect="move",a.preventDefault()}function f(a,b,c){a.addEventListener(b,c,!1)}function g(a,b,c){a.removeEventListener(b,c,!1)}function h(a,b,c){if(a)if(a.classList)a.classList[c?"add":"remove"](b);else{var d=(" "+a.className+" ").replace(I," ").replace(" "+b+" "," ");a.className=(d+(c?" "+b:"")).replace(I," ")}}function i(a,b,c){var d=a&&a.style;if(d){if(void 0===c)return L.defaultView&&L.defaultView.getComputedStyle?c=L.defaultView.getComputedStyle(a,""):a.currentStyle&&(c=a.currentStyle),void 0===b?c:c[b];b in d||(b="-webkit-"+b),d[b]=c+("string"==typeof c?"":"px")}}function j(a,b,c){if(a){var d=a.getElementsByTagName(b),e=0,f=d.length;if(c)for(;f>e;e++)c(d[e],e);return d}return[]}function k(a,b,c,d,e,f,g){var h=L.createEvent("Event"),i=(a||b[J]).options,j="on"+c.charAt(0).toUpperCase()+c.substr(1);h.initEvent(c,!0,!0),h.to=b,h.from=e||b,h.item=d||b,h.clone=v,h.oldIndex=f,h.newIndex=g,b.dispatchEvent(h),i[j]&&i[j].call(a,h)}function l(a,b,c,d,e,f){var g,h,i=a[J],j=i.options.onMove;return j&&(g=L.createEvent("Event"),g.initEvent("move",!0,!0),g.to=b,g.from=a,g.dragged=c,g.draggedRect=d,g.related=e||b,g.relatedRect=f||b.getBoundingClientRect(),h=j.call(i,g)),h}function m(a){a.draggable=!1}function n(){O=!1}function o(a,b){var c=a.lastElementChild,d=c.getBoundingClientRect();return b.clientY-(d.top+d.height)>5&&c}function p(a){for(var b=a.tagName+a.className+a.src+a.href+a.textContent,c=b.length,d=0;c--;)d+=b.charCodeAt(c);return d.toString(36)}function q(a){for(var b=0;a&&(a=a.previousElementSibling);)"TEMPLATE"!==a.nodeName.toUpperCase()&&b++;return b}function r(a,b){var c,d;return function(){void 0===c&&(c=arguments,d=this,setTimeout(function(){1===c.length?a.call(d,c[0]):a.apply(d,c),c=void 0},b))}}function s(a,b){if(a&&b)for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a}var t,u,v,w,x,y,z,A,B,C,D,E,F,G,H={},I=/\s+/g,J="Sortable"+(new Date).getTime(),K=window,L=K.document,M=K.parseInt,N=!!("draggable"in L.createElement("div")),O=!1,P=Math.abs,Q=[].slice,R=[],S=r(function(a,b,c){if(c&&b.scroll){var d,e,f,g,h=b.scrollSensitivity,i=b.scrollSpeed,j=a.clientX,k=a.clientY,l=window.innerWidth,m=window.innerHeight;if(z!==c&&(y=b.scroll,z=c,y===!0)){y=c;do if(y.offsetWidth<y.scrollWidth||y.offsetHeight<y.scrollHeight)break;while(y=y.parentNode)}y&&(d=y,e=y.getBoundingClientRect(),f=(P(e.right-j)<=h)-(P(e.left-j)<=h),g=(P(e.bottom-k)<=h)-(P(e.top-k)<=h)),f||g||(f=(h>=l-j)-(h>=j),g=(h>=m-k)-(h>=k),(f||g)&&(d=K)),(H.vx!==f||H.vy!==g||H.el!==d)&&(H.el=d,H.vx=f,H.vy=g,clearInterval(H.pid),d&&(H.pid=setInterval(function(){d===K?K.scrollTo(K.pageXOffset+f*i,K.pageYOffset+g*i):(g&&(d.scrollTop+=g*i),f&&(d.scrollLeft+=f*i))},24)))}},30);return a.prototype={constructor:a,_onTapStart:function(a){var b=this,c=this.el,e=this.options,f=a.type,g=a.touches&&a.touches[0],h=(g||a).target,i=h,j=e.filter;if(!("mousedown"===f&&0!==a.button||e.disabled)&&(h=d(h,e.draggable,c))){if(C=q(h),"function"==typeof j){if(j.call(this,a,h,this))return k(b,i,"filter",h,c,C),void a.preventDefault()}else if(j&&(j=j.split(",").some(function(a){return a=d(i,a.trim(),c),a?(k(b,a,"filter",h,c,C),!0):void 0})))return void a.preventDefault();(!e.handle||d(i,e.handle,c))&&this._prepareDragStart(a,g,h)}},_prepareDragStart:function(a,b,c){var d,e=this,g=e.el,h=e.options,i=g.ownerDocument;c&&!t&&c.parentNode===g&&(F=a,w=g,t=c,x=t.nextSibling,E=h.group,d=function(){e._disableDelayedDrag(),t.draggable=!0,h.ignore.split(",").forEach(function(a){j(t,a.trim(),m)}),e._triggerDragStart(b)},f(i,"mouseup",e._onDrop),f(i,"touchend",e._onDrop),f(i,"touchcancel",e._onDrop),h.delay?(f(i,"mousemove",e._disableDelayedDrag),f(i,"touchmove",e._disableDelayedDrag),e._dragStartTimer=setTimeout(d,h.delay)):d())},_disableDelayedDrag:function(){var a=this.el.ownerDocument;clearTimeout(this._dragStartTimer),g(a,"mousemove",this._disableDelayedDrag),g(a,"touchmove",this._disableDelayedDrag)},_triggerDragStart:function(a){a?(F={target:t,clientX:a.clientX,clientY:a.clientY},this._onDragStart(F,"touch")):N?(f(t,"dragend",this),f(w,"dragstart",this._onDragStart)):this._onDragStart(F,!0);try{L.selection?L.selection.empty():window.getSelection().removeAllRanges()}catch(b){}},_dragStarted:function(){w&&t&&(h(t,this.options.ghostClass,!0),a.active=this,k(this,w,"start",t,w,C))},_emulateDragOver:function(){if(G){i(u,"display","none");var a=L.elementFromPoint(G.clientX,G.clientY),b=a,c=" "+this.options.group.name,d=R.length;if(b)do{if(b[J]&&b[J].options.groups.indexOf(c)>-1){for(;d--;)R[d]({clientX:G.clientX,clientY:G.clientY,target:a,rootEl:b});break}a=b}while(b=b.parentNode);i(u,"display","")}},_onTouchMove:function(a){if(F){var b=a.touches?a.touches[0]:a,c=b.clientX-F.clientX,d=b.clientY-F.clientY,e=a.touches?"translate3d("+c+"px,"+d+"px,0)":"translate("+c+"px,"+d+"px)";G=b,i(u,"webkitTransform",e),i(u,"mozTransform",e),i(u,"msTransform",e),i(u,"transform",e),a.preventDefault()}},_onDragStart:function(a,b){var c=a.dataTransfer,d=this.options;if(this._offUpEvents(),"clone"==E.pull&&(v=t.cloneNode(!0),i(v,"display","none"),w.insertBefore(v,t)),b){var e,g=t.getBoundingClientRect(),h=i(t);u=t.cloneNode(!0),i(u,"top",g.top-M(h.marginTop,10)),i(u,"left",g.left-M(h.marginLeft,10)),i(u,"width",g.width),i(u,"height",g.height),i(u,"opacity","0.8"),i(u,"position","fixed"),i(u,"zIndex","100000"),w.appendChild(u),e=u.getBoundingClientRect(),i(u,"width",2*g.width-e.width),i(u,"height",2*g.height-e.height),"touch"===b?(f(L,"touchmove",this._onTouchMove),f(L,"touchend",this._onDrop),f(L,"touchcancel",this._onDrop)):(f(L,"mousemove",this._onTouchMove),f(L,"mouseup",this._onDrop)),this._loopId=setInterval(this._emulateDragOver,150)}else c&&(c.effectAllowed="move",d.setData&&d.setData.call(this,c,t)),f(L,"drop",this);setTimeout(this._dragStarted,0)},_onDragOver:function(a){var c,e,f,g=this.el,h=this.options,j=h.group,k=j.put,m=E===j,p=h.sort;if(void 0!==a.preventDefault&&(a.preventDefault(),!h.dragoverBubble&&a.stopPropagation()),E&&!h.disabled&&(m?p||(f=!w.contains(t)):E.pull&&k&&(E.name===j.name||k.indexOf&&~k.indexOf(E.name)))&&(void 0===a.rootEl||a.rootEl===this.el)){if(S(a,h,this.el),O)return;if(c=d(a.target,h.draggable,g),e=t.getBoundingClientRect(),f)return b(!0),void(v||x?w.insertBefore(t,v||x):p||w.appendChild(t));if(0===g.children.length||g.children[0]===u||g===a.target&&(c=o(g,a))){if(c){if(c.animated)return;r=c.getBoundingClientRect()}b(m),l(w,g,t,e,c,r)!==!1&&(g.appendChild(t),this._animate(e,t),c&&this._animate(r,c))}else if(c&&!c.animated&&c!==t&&void 0!==c.parentNode[J]){A!==c&&(A=c,B=i(c));var q,r=c.getBoundingClientRect(),s=r.right-r.left,y=r.bottom-r.top,z=/left|right|inline/.test(B.cssFloat+B.display),C=c.offsetWidth>t.offsetWidth,D=c.offsetHeight>t.offsetHeight,F=(z?(a.clientX-r.left)/s:(a.clientY-r.top)/y)>.5,G=c.nextElementSibling,H=l(w,g,t,e,c,r);H!==!1&&(O=!0,setTimeout(n,30),b(m),q=1===H||-1===H?1===H:z?c.previousElementSibling===t&&!C||F&&C:G!==t&&!D||F&&D,q&&!G?g.appendChild(t):c.parentNode.insertBefore(t,q?G:c),this._animate(e,t),this._animate(r,c))}}},_animate:function(a,b){var c=this.options.animation;if(c){var d=b.getBoundingClientRect();i(b,"transition","none"),i(b,"transform","translate3d("+(a.left-d.left)+"px,"+(a.top-d.top)+"px,0)"),b.offsetWidth,i(b,"transition","all "+c+"ms"),i(b,"transform","translate3d(0,0,0)"),clearTimeout(b.animated),b.animated=setTimeout(function(){i(b,"transition",""),i(b,"transform",""),b.animated=!1},c)}},_offUpEvents:function(){var a=this.el.ownerDocument;g(L,"touchmove",this._onTouchMove),g(a,"mouseup",this._onDrop),g(a,"touchend",this._onDrop),g(a,"touchcancel",this._onDrop)},_onDrop:function(b){var c=this.el,d=this.options;clearInterval(this._loopId),clearInterval(H.pid),clearTimeout(this._dragStartTimer),g(L,"drop",this),g(L,"mousemove",this._onTouchMove),g(c,"dragstart",this._onDragStart),this._offUpEvents(),b&&(b.preventDefault(),!d.dropBubble&&b.stopPropagation(),u&&u.parentNode.removeChild(u),t&&(g(t,"dragend",this),m(t),h(t,this.options.ghostClass,!1),w!==t.parentNode?(D=q(t),k(null,t.parentNode,"sort",t,w,C,D),k(this,w,"sort",t,w,C,D),k(null,t.parentNode,"add",t,w,C,D),k(this,w,"remove",t,w,C,D)):(v&&v.parentNode.removeChild(v),t.nextSibling!==x&&(D=q(t),k(this,w,"update",t,w,C,D),k(this,w,"sort",t,w,C,D))),a.active&&(k(this,w,"end",t,w,C,D),this.save())),w=t=u=x=v=y=z=F=G=A=B=E=a.active=null)},handleEvent:function(a){var b=a.type;"dragover"===b||"dragenter"===b?t&&(this._onDragOver(a),e(a)):("drop"===b||"dragend"===b)&&this._onDrop(a)},toArray:function(){for(var a,b=[],c=this.el.children,e=0,f=c.length,g=this.options;f>e;e++)a=c[e],d(a,g.draggable,this.el)&&b.push(a.getAttribute(g.dataIdAttr)||p(a));return b},sort:function(a){var b={},c=this.el;this.toArray().forEach(function(a,e){var f=c.children[e];d(f,this.options.draggable,c)&&(b[a]=f)},this),a.forEach(function(a){b[a]&&(c.removeChild(b[a]),c.appendChild(b[a]))})},save:function(){var a=this.options.store;a&&a.set(this)},closest:function(a,b){return d(a,b||this.options.draggable,this.el)},option:function(a,b){var c=this.options;return void 0===b?c[a]:void(c[a]=b)},destroy:function(){var a=this.el;a[J]=null,g(a,"mousedown",this._onTapStart),g(a,"touchstart",this._onTapStart),g(a,"dragover",this),g(a,"dragenter",this),Array.prototype.forEach.call(a.querySelectorAll("[draggable]"),function(a){a.removeAttribute("draggable")}),R.splice(R.indexOf(this._onDragOver),1),this._onDrop(),this.el=a=null}},a.utils={on:f,off:g,css:i,find:j,bind:c,is:function(a,b){return!!d(a,b,a)},extend:s,throttle:r,closest:d,toggleClass:h,index:q},a.version="1.2.1",a.create=function(b,c){return new a(b,c)},a});;
/** Trumbowyg v2.0.0-beta.5 - A lightweight WYSIWYG editor - alex-d.github.io/Trumbowyg - License MIT - Author : Alexandre Demode (Alex-D) / alex-d.fr */
jQuery.trumbowyg={langs:{en:{viewHTML:"View HTML",formatting:"Formatting",p:"Paragraph",blockquote:"Quote",code:"Code",header:"Header",bold:"Bold",italic:"Italic",strikethrough:"Stroke",underline:"Underline",strong:"Strong",em:"Emphasis",del:"Deleted",unorderedList:"Unordered list",orderedList:"Ordered list",insertImage:"Insert Image",insertVideo:"Insert Video",link:"Link",createLink:"Insert link",unlink:"Remove link",justifyLeft:"Align Left",justifyCenter:"Align Center",justifyRight:"Align Right",justifyFull:"Align Justify",horizontalRule:"Insert horizontal rule",removeformat:"Remove format",fullscreen:"fullscreen",close:"Close",submit:"Confirm",reset:"Cancel",required:"Required",description:"Description",title:"Title",text:"Text",target:"Target"}},opts:{},btnsGrps:{design:["bold","italic","underline","strikethrough"],semantic:["strong","em","del"],justify:["justifyLeft","justifyCenter","justifyRight","justifyFull"],lists:["unorderedList","orderedList"]}},function(e,t,n,o,i){"use strict";o.fn.trumbowyg=function(e,t){if(e===Object(e)||!e)return this.each(function(){o(this).data("trumbowyg")||o(this).data("trumbowyg",new r(this,e))});if(1===this.length)try{var n=o(this).data("trumbowyg");switch(e){case"openModal":return n.openModal(t.title,t.content);case"closeModal":return n.closeModal();case"openModalInsert":return n.openModalInsert(t.title,t.fields,t.callback);case"saveSelection":return n.saveSelection();case"getSelection":return n.selection;case"getSelectedText":return n.getSelectedText();case"restoreSelection":return n.restoreSelection();case"destroy":return n.destroy();case"empty":return n.empty();case"lang":return n.lang;case"html":return n.html(t)}}catch(i){}return!1};var r=function(e,t){var i=this;i.doc=e.ownerDocument||n,i.$ta=o(e),i.$c=o(e),t=o.extend(!0,{},t,o.trumbowyg.opts),"undefined"==typeof t.lang||"undefined"==typeof o.trumbowyg.langs[t.lang]?i.lang=o.trumbowyg.langs.en:i.lang=o.extend(!0,{},o.trumbowyg.langs.en,o.trumbowyg.langs[t.lang]);var r=i.lang.header;i.o=o.extend(!0,{},{lang:"en",dir:"ltr",closable:!1,fullscreenable:!0,fixedBtnPane:!1,fixedFullWidth:!1,autogrow:!1,prefix:"trumbowyg-",semantic:!0,resetCss:!1,removeformatPasted:!1,tagsToRemove:[],btns:["viewHTML","|","formatting","|","btnGrp-design","|","link","|","insertImage","|","btnGrp-justify","|","btnGrp-lists","|","horizontalRule","|","removeformat"],btnsAdd:[],btnsDef:{viewHTML:{func:"toggle"},p:{func:"formatBlock"},blockquote:{func:"formatBlock"},h1:{func:"formatBlock",title:r+" 1"},h2:{func:"formatBlock",title:r+" 2"},h3:{func:"formatBlock",title:r+" 3"},h4:{func:"formatBlock",title:r+" 4"},bold:{key:"B"},italic:{key:"I"},underline:{},strikethrough:{},strong:{func:"bold",key:"B"},em:{func:"italic",key:"I"},del:{func:"strikethrough"},createLink:{key:"K"},unlink:{},insertImage:{},justifyLeft:{},justifyCenter:{},justifyRight:{},justifyFull:{},unorderedList:{func:"insertUnorderedList"},orderedList:{func:"insertOrderedList"},horizontalRule:{func:"insertHorizontalRule"},removeformat:{},formatting:{dropdown:["p","blockquote","h1","h2","h3","h4"]},link:{dropdown:["createLink","unlink"]}},inlineElementsSelector:"a, abbr, acronym, b, caption, cite, code, col, dfn, dir, dt, dd, em, font, hr, i, kbd, li, q, span, strikeout, strong, sub, sup, u"},t),t.btns?i.o.btns=t.btns:i.o.semantic&&(i.o.btns[4]="btnGrp-semantic"),i.keys=[],i.init()};r.prototype={init:function(){var e=this;e.height=e.$ta.height(),e.buildEditor(),e.buildBtnPane(),e.fixedBtnPaneEvents(),e.buildOverlay()},buildEditor:function(){var e=this,i=e.o.prefix,r="";e.$box=o("<div/>",{"class":i+"box "+i+"editor-visible "+i+e.o.lang+" trumbowyg"}),e.isTextarea=e.$ta.is("textarea"),e.isTextarea?(r=e.$ta.val(),e.$ed=o("<div/>"),e.$box.insertAfter(e.$ta).append(e.$ed,e.$ta)):(e.$ed=e.$ta,r=e.$ed.html(),e.$ta=o("<textarea/>",{name:e.$ta.attr("id"),height:e.height}).val(r),e.$box.insertAfter(e.$ed).append(e.$ta,e.$ed),e.syncCode()),e.$ta.addClass(i+"textarea").attr("tabindex",-1),e.$ed.addClass(i+"editor").attr({contenteditable:!0,dir:e.lang._dir||e.o.dir}).html(r),e.o.tabindex&&e.$ed.attr("tabindex",e.o.tabindex),e.$c.is("[placeholder]")&&e.$ed.attr("placeholder",e.$c.attr("placeholder")),e.o.resetCss&&e.$ed.addClass(i+"reset-css"),e.o.autogrow||e.$ta.add(e.$ed).css({height:e.height}),e.semanticCode(),e._ctrl=!1,e.$ed.on("dblclick","img",function(){var t=o(this);return e.openModalInsert(e.lang.insertImage,{url:{label:"URL",value:t.attr("src"),required:!0},alt:{label:e.lang.description,value:t.attr("alt")}},function(e){return t.attr({src:e.url,alt:e.alt})}),!1}).on("keydown",function(t){if(e._composition=229===t.which,t.ctrlKey){e._ctrl=!0;var n=e.keys[String.fromCharCode(t.which).toUpperCase()];try{return e.execCmd(n.func,n.param),!1}catch(t){}}}).on("keyup",function(t){e._ctrl||17===t.which||e._composition||(e.semanticCode(!1,13===t.which),e.$c.trigger("tbwchange")),setTimeout(function(){e._ctrl=!1},200)}).on("focus blur",function(t){e.$c.trigger("tbw"+t.type)}).on("paste",function(o){if(e.o.removeformatPasted){o.preventDefault();try{var i=t.clipboardData.getData("Text");try{e.doc.selection.createRange().pasteHTML(i)}catch(r){e.doc.getSelection().getRangeAt(0).insertNode(n.createTextNode(i))}}catch(r){e.execCmd("insertText",(o.originalEvent||o).clipboardData.getData("text/plain"))}}setTimeout(function(){e.o.semantic?e.semanticCode(!1,!0):e.syncCode(),e.$c.trigger("tbwpaste",o)},0)}),e.$ta.on("keyup paste",function(){e.$c.trigger("tbwchange")}),o(e.doc).on("keydown",function(t){return 27===t.which?(e.closeModal(),!1):void 0})},buildBtnPane:function(){var e=this,n=e.o.prefix;if(e.o.btns!==!1){e.$btnPane=o("<ul/>",{"class":n+"button-pane"}),o.each(e.o.btns.concat(e.o.btnsAdd),function(t,r){try{var a=r.split("btnGrp-");a[1]!==i&&(r=o.trumbowyg.btnsGrps[a[1]])}catch(s){}o.isArray(r)||(r=[r]),o.each(r,function(t,i){try{var r=o("<li/>");"|"===i?r.addClass(n+"separator"):e.isSupportedBtn(i)&&r.append(e.buildBtn(i)),e.$btnPane.append(r)}catch(a){}})});var r=o("<li/>",{"class":n+"not-disable "+n+"buttons-right"});e.o.fullscreenable&&r.append(e.buildRightBtn("fullscreen").on("click",function(){var i=n+"fullscreen";e.$box.toggleClass(i),o("body").toggleClass(n+"body-fullscreen",e.$box.hasClass(i)),o(t).trigger("scroll")})),e.o.closable&&r.append(e.buildRightBtn("close").on("click",function(){e.$box.removeClass(n+"fullscreen"),e.destroy(),e.$c.trigger("tbwclose")})),r.not(":empty")&&e.$btnPane.append(r),e.$box.prepend(e.$btnPane)}},buildBtn:function(e){var t=this,n=t.o.prefix,i=t.o.btnsDef[e],r=i.dropdown,a=t.lang[e]||e,s=o("<button/>",{type:"button","class":n+e+"-button"+(i.ico?" "+n+i.ico+"-button":""),text:i.text||i.title||a,title:i.title||i.text||a+(i.key?" (Ctrl + "+i.key+")":""),tabindex:-1,mousedown:function(){return(!r||o("."+e+"-"+n+"dropdown",t.$box).is(":hidden"))&&o("body",t.doc).trigger("mousedown"),!t.$btnPane.hasClass(n+"disable")||o(this).hasClass(n+"active")||o(this).parent().hasClass(n+"not-disable")?(t.execCmd((r?"dropdown":!1)||i.func||e,i.param||e),!1):!1}});if(r){s.addClass(n+"open-dropdown");var l=n+"dropdown",c=o("<div/>",{"class":e+"-"+l+" "+l+" "+n+"fixed-top"});o.each(r,function(e,n){t.o.btnsDef[n]&&t.isSupportedBtn(n)&&c.append(t.buildSubBtn(n))}),t.$box.append(c.hide())}else i.key&&(t.keys[i.key]={func:i.func||e,param:i.param||e});return s},buildSubBtn:function(e){var t=this,n=t.o.btnsDef[e];return n.key&&(t.keys[n.key]={func:n.func||e,param:n.param||e}),o("<button/>",{type:"button","class":t.o.prefix+e+"-dropdown-button"+(n.ico?" "+t.o.prefix+n.ico+"-button":""),text:n.text||n.title||t.lang[e]||e,title:n.key?" (Ctrl + "+n.key+")":null,style:n.style||null,mousedown:function(){return o("body",t.doc).trigger("mousedown"),t.execCmd(n.func||e,n.param||e),!1}})},buildRightBtn:function(e){var t=this.lang[e];return o("<button/>",{type:"button","class":this.o.prefix+e+"-button",title:t,text:t,tabindex:-1})},isSupportedBtn:function(e){try{return this.o.btnsDef[e].isSupported()}catch(t){}return!0},buildOverlay:function(){var e=this;return e.$overlay=o("<div/>",{"class":e.o.prefix+"overlay"}).css({top:e.$btnPane.outerHeight(),height:e.$ed.outerHeight()+1+"px"}).appendTo(e.$box),e.$overlay},showOverlay:function(){var e=this;o(t).trigger("scroll"),e.$overlay.fadeIn(200),e.$box.addClass(e.o.prefix+"box-blur")},hideOverlay:function(){var e=this;e.$overlay.fadeOut(50),e.$box.removeClass(e.o.prefix+"box-blur")},fixedBtnPaneEvents:function(){var e=this,n=e.o.fixedFullWidth,i=e.$box;e.o.fixedBtnPane&&(e.isFixed=!1,o(t).on("scroll resize",function(){if(i){e.syncCode();var r=o(t).scrollTop(),a=i.offset().top+1,s=e.$btnPane,l=s.outerHeight();r-a>0&&r-a-e.height<0?(e.isFixed||(e.isFixed=!0,s.css({position:"fixed",top:0,left:n?"0":"auto",zIndex:7}),o([e.$ta,e.$ed]).css({marginTop:s.height()})),s.css({width:n?"100%":i.width()-1+"px"}),o("."+e.o.prefix+"fixed-top",i).css({position:n?"fixed":"absolute",top:n?l:l+(r-a)+"px",zIndex:15})):e.isFixed&&(e.isFixed=!1,s.removeAttr("style"),o([e.$ta,e.$ed]).css({marginTop:0}),o("."+e.o.prefix+"fixed-top",i).css({position:"absolute",top:l}))}}))},destroy:function(){var e=this,t=e.o.prefix,n=e.height;e.isTextarea?e.$box.after(e.$ta.css({height:n}).val(e.html()).removeClass(t+"textarea").show()):e.$box.after(e.$ed.css({height:n}).removeClass(t+"editor").removeAttr("contenteditable").html(e.html()).show()),e.$box.remove(),e.$c.removeData("trumbowyg")},empty:function(){this.$ta.val(""),this.syncCode(!0)},toggle:function(){var e=this,t=e.o.prefix;e.semanticCode(!1,!0),setTimeout(function(){e.$box.toggleClass(t+"editor-hidden "+t+"editor-visible"),e.$btnPane.toggleClass(t+"disable"),o("."+t+"viewHTML-button",e.$btnPane).toggleClass(t+"active"),e.$box.hasClass(t+"editor-visible")?e.$ta.attr("tabindex",-1):e.$ta.removeAttr("tabindex")},0)},dropdown:function(e){var n=this,i=n.doc,r=n.o.prefix,a=o("."+e+"-"+r+"dropdown",n.$box),s=o("."+r+e+"-button",n.$btnPane);if(a.is(":hidden")){var l=s.offset().left;s.addClass(r+"active"),a.css({position:"absolute",top:n.$btnPane.outerHeight(),left:n.o.fixedFullWidth&&n.isFixed?l+"px":l-n.$btnPane.offset().left+"px"}).show(),o(t).trigger("scroll"),o("body",i).on("mousedown",function(){o("."+r+"dropdown",i).hide(),o("."+r+"active",i).removeClass(r+"active"),o("body",i).off("mousedown")})}else o("body",i).trigger("mousedown")},html:function(e){var t=this;return e?(t.$ta.val(e),t.syncCode(!0),t):t.$ta.val()},syncCode:function(e){var t=this;!e&&t.$ed.is(":visible")?(t.$ta.val(t.$ed.html()),t.$c.trigger("tbwchange")):t.$ed.html(t.$ta.val()),t.o.autogrow&&(t.height=t.$ed.height(),t.height!=t.$ta.css("height")&&(t.$ta.css({height:t.height}),t.$c.trigger("tbwresize")))},semanticCode:function(e,t){var n=this;if(n.syncCode(e),n.saveSelection(),n.o.tagsToRemove.length>0&&o(n.o.tagsToRemove.join(", "),n.$ed).remove(),n.o.semantic){if(n.semanticTag("b","strong"),n.semanticTag("i","em"),n.semanticTag("strike","del"),t){var i=n.o.inlineElementsSelector,r=":not("+n.o.inlineElementsSelector+")";n.$ed.contents().filter(function(){return 3===this.nodeType&&o.trim(this.nodeValue).length>0}).wrap("<span data-trumbowyg-textnode/>");var a=function(e){if(0!==e.length){var t=e.nextUntil(r).andSelf().wrapAll("<p/>").parent();t.next("br").remove();var n=t.nextAll(i).first();n.length&&a(n)}};a(n.$ed.children(i).first()),n.semanticTag("div","p",!0),n.$ed.find("p").filter(function(){return n.selection&&this===n.selection.startContainer?!1:0===o(this).text().trim().length&&0===o(this).children().not("br, span").length}).contents().unwrap(),o("[data-trumbowyg-textnode]",n.$ed).contents().unwrap(),n.$ed.find("p:empty").replaceWith("<br/>")}n.restoreSelection(),n.$ta.val(n.$ed.html())}},semanticTag:function(e,t,n){o(e,this.$ed).each(function(){var e=o(this);e.wrap("<"+t+"/>"),n&&o.each(e.prop("attributes"),function(){e.parent().attr(this.name,this.value)}),e.contents().unwrap()})},createLink:function(){var e=this;e.saveSelection(),e.openModalInsert(e.lang.createLink,{url:{label:"URL",required:!0},title:{label:e.lang.title},text:{label:e.lang.text,value:e.getSelectedText()},target:{label:e.lang.target}},function(t){var n=o(['<a href="',t.url,'">',t.text,"</a>"].join(""));return t.title.length>0&&n.attr("title",t.title),t.target.length>0&&n.attr("target",t.target),e.selection.deleteContents(),e.selection.insertNode(n.get(0)),e.restoreSelection(),!0})},insertImage:function(){var e=this;e.saveSelection(),e.openModalInsert(e.lang.insertImage,{url:{label:"URL",required:!0},alt:{label:e.lang.description,value:e.getSelectedText()}},function(t){return e.execCmd("insertImage",t.url),o('img[src="'+t.url+'"]:not([alt])',e.$box).attr("alt",t.alt),!0})},execCmd:function(t,n){var o=this;"dropdown"!=t&&o.$ed.focus();try{o[t](n)}catch(i){try{t(n,o)}catch(r){"insertHorizontalRule"==t?n=null:"formatBlock"!=t||-1===e.userAgent.indexOf("MSIE")&&-1===e.appVersion.indexOf("Trident/")||(n="<"+n+">"),o.doc.execCommand(t,!1,n)}}"dropdown"!=t&&o.syncCode()},openModal:function(e,n){var i=this,r=i.o.prefix;if(o("."+r+"modal-box",i.$box).length>0)return!1;i.saveSelection(),i.showOverlay(),i.$btnPane.addClass(r+"disable");var a=o("<div/>",{"class":r+"modal "+r+"fixed-top"}).css({top:i.$btnPane.height()+1+"px"}).appendTo(i.$box);i.$overlay.one("click",function(){return a.trigger(r+"cancel"),!1});var s=o("<form/>",{action:"",html:n}).on("submit",function(){return a.trigger(r+"confirm"),!1}).on("reset",function(){return a.trigger(r+"cancel"),!1}),l=o("<div/>",{"class":r+"modal-box",html:s}).css({top:"-"+i.$btnPane.outerHeight()+"px",opacity:0}).appendTo(a).animate({top:0,opacity:1},100);return o("<span/>",{text:e,"class":r+"modal-title"}).prependTo(l),a.height(l.outerHeight()+10),o("input:first",l).focus(),i.buildModalBtn("submit",l),i.buildModalBtn("reset",l),o(t).trigger("scroll"),a},buildModalBtn:function(e,t){var n=this,i=n.o.prefix;return o("<button/>",{"class":i+"modal-button "+i+"modal-"+e,type:e,text:n.lang[e]||e}).appendTo(o("form",t))},closeModal:function(){var e=this,t=e.o.prefix;e.$btnPane.removeClass(t+"disable"),e.$overlay.off();var n=o("."+t+"modal-box",e.$box);n.animate({top:"-"+n.height()},100,function(){n.parent().remove(),e.hideOverlay()}),e.restoreSelection()},openModalInsert:function(e,t,n){var i=this,r=i.o.prefix,a=i.lang,s="";return o.each(t,function(e,t){var n=t.label,o=t.name||e;s+='<label><input type="'+(t.type||"text")+'" name="'+o+'" value="'+(t.value||"")+'"><span class="'+r+'input-infos"><span>'+(n?a[n]?a[n]:n:a[e]?a[e]:e)+"</span></span></label>"}),i.openModal(e,s).on(r+"confirm",function(){var e=o("form",o(this)),a=!0,s={};o.each(t,function(t,n){var r=o('input[name="'+t+'"]',e);s[t]=o.trim(r.val()),n.required&&""===s[t]?(a=!1,i.addErrorOnModalField(r,i.lang.required)):n.pattern&&!n.pattern.test(s[t])&&(a=!1,i.addErrorOnModalField(r,n.patternError))}),a&&(i.restoreSelection(),n(s,t)&&(i.syncCode(),i.closeModal(),o(this).off(r+"confirm")))}).one(r+"cancel",function(){o(this).off(r+"confirm"),i.closeModal()})},addErrorOnModalField:function(e,t){var n=this.o.prefix,i=e.parent();e.on("change keyup",function(){i.removeClass(n+"input-error")}),i.addClass(n+"input-error").find("input+span").append(o("<span/>",{"class":n+"msg-error",text:t}))},saveSelection:function(){var e=this,t=e.doc.selection;if(e.selection=null,e.doc.getSelection){var n=e.doc.getSelection();n.getRangeAt&&n.rangeCount&&(e.selection=n.getRangeAt(0))}else t&&t.createRange&&(e.selection=t.createRange())},restoreSelection:function(){var e=this,t=e.selection;if(t)if(e.doc.getSelection){var n=e.doc.getSelection();try{n.removeAllRanges()}catch(o){}n.addRange(t)}else e.doc.selection&&t.select&&t.select()},getSelectedText:function(){var e=this.selection;return e.text!==i?e.text:e+""}}}(navigator,window,document,jQuery);;
var Ajax = (function(){

    function send(url, type, data, successCallback, noMessage)
    {
        $.ajax({ url: url, type: type, data: data, dataType: 'json',
            success: function(r) {
                if (r && r.success) {
                    if (typeof successCallback == "function") {
                        successCallback(r);
                    }
                    if (r.message) {
                        Messages.success(r.message);
                    }
                } else { 
                    if (r.errors && r.errors.length > 0) {
                        Messages.error(r.errors);
                    }
                }
            },
            error: function(xhr) {

                if (x.status == 401) {
                    Messages.error("Your session has timed out. You need to log in again.");
                } else {
                    Messages.error("An unspecified error occurred. Please try again.");    
                }
   
            }

        });
    }

    function sendForm($form, successCallback, errorCallback)
    {
        var url  = $form.attr('action'),
            type = $form.attr('method'),
            data = $form.serialize();

        $.ajax({ url: url, type: type, data: data, dataType: 'json',
            success: function(r) {
                if (r && r.success) {
                    if (r.message) {
                        Messages.success(r.message);
                    }
                    if (typeof successCallback == "function") {
                        successCallback(r);
                    }
                } else { 
                    if (r.errors && r.errors.length > 0) {
                        Messages.error(r.errors);
                    }
                    if (typeof errorCallback == "function") {
                        errorCallback(r);
                    }
                }
            },
            error: function(xhr) {

                if (xhr.status == 401) {
                    Messages.error("Your session has timed out. You need to log in again.");
                }

                if (typeof errorCallback == "function") {
                    errorCallback(r);
                } else if (xhr.status != 401) {
                    Messages.error("An unspecified error occurred. Please try again.");    
                }
            }

        });
    }

    return {
        sendForm: sendForm,
        send: send
    }

})();
;
var FileBrowser = (function(){

    var fileContainer,
        filesLoaded = false,
        modalStatus = 0,
        filesInQueue = 0,
        currentFile  = 0,
        uploader;

    function init(container)
    {
        fileContainer = container;
        showPreviews();

        if ($(fileContainer).length > 0) {
            check();
            $(".selected-file", fileContainer).on("change", function(){
                check();
            });
        }

        $("body").on("click", ".file-item-container .select-button", function(e) {
            e.preventDefault();
            var uri = $(this).data('uri'),
                id  = $(this).data('id');

            if (!uri || !id) {
                return;
            }

            $("#" + id).val(uri);
            check();
            Modal.hide();
        });

        $("body").on("click", ".file-item-container .delete-button", function(e) {
            e.preventDefault();
            var data = {
                file: $(this).data('file'),
                csrf_token: envvars.delete_csrf_token
            };

            if (!data.file) {
                return;
            }

            Ajax.send(envvars.paths.file_browser_delete, "post", data, function(){
                loadFiles();
            });
        });

    }

    function registerUploader($container)
    {
        if (uploader) {
            return;
        }

        var $container;

        uploader = new ss.SimpleUpload({
            button: 'file-browse-button',
            url: envvars.paths.upload,
            responseType: 'json',
            name: 'uploadfile',
            multiple: true,
            queue: true,
            maxUploads: 1,
            hoverClass: 'ui-state-hover',
            focusClass: 'ui-state-focus',
            disabledClass: 'ui-state-disabled',   
            onSubmit: function(filename, extension) 
            {
                var $wrapper = $("#progress-template .uploading-wrapper").clone(),
                    $bar      = $(".bar", $wrapper),
                    $info     = $(".info", $wrapper);

                currentFile++;
                var info = '';
                if (filesInQueue == 1) {
                    info = '<strong>Uploading: </strong>' + filename + "</strong>";
                } else {
                    info = '<strong>Uploading ' + currentFile + ' of ' + filesInQueue + ': </strong>' + filename + "</strong>";
                }
                $info.html(info);
                $("#progress-box").append($wrapper);

                this.setProgressBar($bar);
                this.setProgressContainer($wrapper);
            },
            onComplete:   function(filename, r) 
            {
                if (!r) {
                    Messages.error("An unspecified error occurred uploading " + filename);
                    return false;
                }

                if (!r.success) {
                    Messages.error(r.errors);
                    return;
                }

                Messages.success('File ' + filename + ' is uploaded');
                if (currentFile == filesInQueue) {
                    currentFile  = 0;
                    filesInQueue = 0;
                }

                loadFiles();
            },
            onError: function(filename, status, statusText) 
            {
                Messages.error("An unspecified error occurred uploading " + filename);
                console.log(status, statusText);
            },
            onChange: function(filename, extension, uploadBtn, fileSize, file) 
            {
                filesInQueue++;
            }
        });    
    }

    function showFileBrowser(status, id)
    {
        var data = {
            'status': status? status : '',
            'id': id? id : ''
        };
        
        Modal.show("File browser");

        Ajax.send(envvars.paths.file_browser, "get", data,  function(r) 
        {
            if (!r.data) {
                return;
            }

            Modal.setContent('<div id="file-browser-container" class="file-browser-modal"></div>');
            var $container = $("#file-browser-container");
            $container.append(r.data);
            registerUploader($container);

        }, true);
    }

    function check()
    {
        $(fileContainer).each(function(){
            var $field   = $(this),
                filename = $(".selected-file", $field).val(),
                $preview = $(".selected-file-preview", $field);

            if (isImage(filename)) {
                $preview.html('<img src="' + filename + '" />');
            } else {
                $preview.html('');
            }
        });
    }

    function loadFiles(callback)
    {
        $.ajax({
            url: envvars.paths.files,
            type: 'get',
            dataType: 'json',
            success: function(r) {
                if (r && r.data) {
                    $("#file-list .file-item-container.item").remove();
                    for(var i in r.data) {
                        addItem(r.data[i]);
                    }
    
                    if (typeof callback == "function") {
                        callback();
                    }

                    if ($("#file-list").hasClass("preview-view")) {
                        showPreviews();
                    }

                    return;
                }
            },
            error: function() {}
        });
    }

    function showPreviews()
    {
        $(".file-item-container.image .preview img").each(function(){
            var file = $(this).data("file");
            $(this).attr('src', file);
        });
    }

    function addItem(data)
    {
        var template = $("#file-item-template").html();
        template = placeholders(template, data);
        $("#file-list").append(template);
    }

    function placeholders(tpl, data)
    {
        data.icon = data.type == 'executable' || data.type == 'misc'
                ? 'file-o'
                : 'file-' + data.type + '-o';

        for(var i in data) {
            tpl = tpl.replace(new RegExp(RegExp.escape("[["+i+"]]"), "g"), data[i]);
        }

        return tpl;
    }

    return {
        init: init,
        check: check,
        showFileBrowser: showFileBrowser,
        registerUploader: registerUploader,
        loadFiles: loadFiles
    }

})();
;
var Messages = (function(){

    var $container, 
        duration = 5000;

    function init($msgContainer)
    {
        $container = $msgContainer;
    }

    function error(msg)
    {
        add('error', msg);
    }

    function success(msg)
    {
        add('success', msg);
    }

    function add(type, message)
    {
        if (Array.isArray(message)) {
            message = "<ul><li>" + message.join("</li><li>") + "</li></ul>";
        } else if (typeof message == "object") {
            return;
        }

        $closeButton = $('<a href="#" class="close-button"><span class="fa fa-close icon"></span></a>');

        $message = $('<div class="message ' + type + '">' + message + '</div>');
        $message.append($closeButton);
        
        $container.append($message);
        $message.fadeIn(200);
        
        var $item = $message;

        $closeButton.on("click", function(e) {
            e.preventDefault();
            remove($item);
        });

        $message.on("click", function(e) {
            e.preventDefault();
            remove($(this));
        });

        window.setTimeout(function(){
            remove($item);
        }, duration);
    }

    function remove($message)
    {
        $message.slideUp(400, function(){
            $message.remove();
        });
    }

    return {
        init: init,
        error: error,
        success: success
    }

})();;
var Modal = (function(){

    var $overlay, $container, $content, $title, 
        opened = false;

    function init()
    {
        $overlay   = $("#overlay");
        $container = $("#modal-container");
        $content   = $("#modal-content");
        $title     = $("#modal-title");
    
        $("#overlay").on("click", function(e){
            e.preventDefault();
            Modal.hide();
        });

        $("#modal-close").on("click", function(e){
            e.preventDefault();
            Modal.hide();
        });
    }

    function show(title, content)
    {
        if (!opened) {
            $overlay.show();
            $container.show();
            $("body").addClass('no-scroll');
            opened = true;
        }

        if (title) {
            $title.html(title);
        }
        if (content) {
            hideSpinner();
            $content.html(content);
        }
    }

    function hide()
    {
        if (opened) {
            $overlay.hide();
            $container.hide();
            $content.html('');
            showSpinner();
            $title.html('');
            $("body").removeClass('no-scroll');
            opened = false;
        }
    }

    function setTitle(title)
    {
        $title.html(title);
    }

    function setContent(content)
    {
        hideSpinner();
        $content.html(content);
    }

    function showSpinner()
    {
        $content.addClass('spinner');
    }

    function hideSpinner()
    {
        $content.removeClass('spinner');        
    }

    function isOpen()
    {
        return opened;
    }

    return {
        init: init,
        show: show,
        hide: hide,
        isOpen: isOpen,
        setTitle: setTitle,
        setContent: setContent,
        showSpinner: showSpinner,
        hideSpinner: hideSpinner
    }

})();
;
var Preview = (function(){

    function show()
    {
        Modal.show("Preview", '<script id="preview-body"></script>');
    }

    function hide()
    {
        Modal.hide();
    }

    return {
        show: show,
        hide: hide
    }

})();

;
$(function(){

    /*
     * Local switcher
     * -----------------------------------------------
     */
    $("#locale-switcher").on("change", function() {
        $.ajax({
            url: envvars.paths.locale_set,
            dataType: 'json',
            type: 'post',
            data: { locale: $(this).val() },
            success: function(r) {
                if (r && r.success) {
                    location.reload();
                    return;
                }
            }
        });
    });


    /*
     * Wysiwyg setup
     * -----------------------------------------------
     */
    $('textarea.field-wysiwyg').trumbowyg({
        fullscreenable: false
    });


    /*
     * Hot keys
     * -----------------------------------------------
     */
    $("body").on("keydown", function(e) {
        if (e.keyCode == 27) { // ESC
            if (Modal.isOpen()) {
                Modal.hide();
            }
        }
    });


    /*
     * Form button actions
     * -----------------------------------------------
     */
    $("#save-content-button").on("click", function(e) {
        e.preventDefault();
        Ajax.sendForm($("#edit-content-form"));
    });

    $("#save-settings-button").on("click", function(e) {
        e.preventDefault();
        Ajax.sendForm($("#edit-settings-form"));
    });

    $("#save-user-button").on("click", function(e) {
        e.preventDefault();
        Ajax.sendForm($("#edit-user-form"));
    });

    $("#save-list-item-button").on("click", function(e) {
        e.preventDefault();
        Ajax.sendForm($("#edit-list-item-form"), function() {
            if ($("#new-notice").length == 1) {
                $("#new-notice").remove();
            }
        });
    });

    $("#delete-list-item-button").on("click", function(e) {
        e.preventDefault();
        if (!confirm("Are you sure you want to delete this item?")) {
            return;
        }
        var url = $(this).data('url');
        Ajax.send(url, 'post', $("#edit-list-item-form").serialize(), function() {
            location.href = envvars.paths.list_items.replace('{LIST_KEY}', $("#list_key").val());
        });
    });

    
    /*
     * File browser
     * -----------------------------------------------
     */
    FileBrowser.init('.field-select-file');

    $(".field-select-file-button").on("click", function(e){
        e.preventDefault();
        var id = $(this).data('id');
        FileBrowser.showFileBrowser('select', id);
    });

    $(".clear-selected-file").on("click", function(e) {
        e.preventDefault();
        var id = $(this).data('id');
        if (!id) {
            return;
        }

        $("#" + id).val("");
        FileBrowser.check();
    });


    /*
     * Preview
     * -----------------------------------------------
     */
    $("#preview-button").on("click", function(e){
        e.preventDefault();

        var $form  = $(this).parents("form"),
            action = $form.attr('action'),
            target = $form.attr('target'),
            url    = $form.data('preview');

        if (!url) {
            return;
        }

        Modal.show("Preview", '<iframe id="preview-body" name="preview-body"></iframe>');

        // Change the form to the preview action and target
        $form.attr('action', url)
            .attr('target', 'preview-body')
            .submit();

        // Change the form back to the original target and action
        $form.attr('action', action).attr('target', !target? '_self' : target);

    });


    /*
     * Modules setup
     * -----------------------------------------------
     */
    Modal.init();
    Messages.init($("#messages"));

});


/**
 * HELPERS
 * ----------------------------------------------------------------------------
 **/
if( typeof Array.isArray !== 'function' ) {
    Array.isArray = function( arr ) {
        return Object.prototype.toString.call( arr ) === '[object Array]';
    };
}

RegExp.escape = function(str) {
     return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
 };

String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

function isImage(filename)
{
    if (typeof filename == "string" && filename.indexOf('.') > 0) {
        var ext = filename.split('.').pop().toLowerCase();
        return ext == 'jpg' || ext == 'gif' || ext == 'tiff';
    }
    
    return false;
}
