/**
 * Main content file 
 *          - Runs in sandbox env, has access to main page DOM but doesnt have access to main js objects
 *          - Script JS in injected into main DOM to pass required JS values over to context (sandboxed env)
 * EntryPoint
 */

var ACCOUNT_UUID
var EXT_DEBUG = false;
var extconsole =  {
    log: function(){
        if (EXT_DEBUG){
            var args = Array.prototype.slice.call(arguments);
            console.log.apply(console, args);
        }
    },
    error: function(){
        if (EXT_DEBUG){
            var args = Array.prototype.slice.call(arguments);
            console.error.apply(console, args);
        }
    }
};
/**
 * Routes that this application will enhance|touch|alter
 */
 const enhancedRoutesList = {
    "campaigns": campaignHandler,
    "internaltools": internalToolsHandler,
    "splitsegments": splitsegmentsHandler
}
 
/**
 * Sidebar nav for internal tools
 */
function add_sidebar_menu(){
    extconsole.log('content:','adding sidebar menu')
    const sideBarInternalToolsMenuHtml = `
    <div class="menu-item" data-v-3b122c2b="">
        <a id="internalToolsHref" href="#/app/internaltools" class="menu-item-link" data-v-3b122c2b="">
            <div class="flex flex-center menu-item-icon" data-v-3b122c2b="">
                    <i class="glyphicon glyphicon-wrench"></i>
            </div><span class="menu-item-link-text" data-v-3b122c2b="">Internal Tools</span>
        </a>
    </div>
    `
    const sideBarSplitSegmentsMenuHtml = `
    <div class="menu-item" data-v-3b122c2b="">
        <a id="splitsegmentsHref" href="#/app/splitsegments" class="menu-item-link" data-v-3b122c2b="">
            <div class="flex flex-center menu-item-icon" data-v-3b122c2b="">
                    <i class="glyphicon glyphicon-random"></i>
            </div><span class="menu-item-link-text" data-v-3b122c2b="" style="margin-left: 5px;">Split Segments</span>
        </a>
    </div>
    `
    jQuery( "#vue-app-comp > div.wrapper > div.items" ).append(sideBarInternalToolsMenuHtml)
    jQuery( "#vue-app-comp > div.wrapper > div.items" ).append(sideBarSplitSegmentsMenuHtml)
    jQuery('#internalToolsHref').on("click", function(){ 
        $(this).attr("href","#/internaltools");
    })
    jQuery('#splitsegmentsHref').on("click", function(){ 
        $(this).attr("href","#/splitsegments");
    })
}

/**
 * This will load helper script that send message from main page to content script
 * 
 */
function loadHelperScriptToActualPageDom(){
    extconsole.log('content:','loading helper script')
    var s = document.createElement('script');
    s.src = chrome.extension.getURL('script.js');
    (document.head||document.documentElement).appendChild(s);
    s.onload = function() {
        s.remove();
    };
}

/**
 * Returns enhancedRouteName for specific route
 * @param {*} routesEnhanced 
 * @param {*} url 
 * @returns 
 */
function getRouteHandler(enhancedRoutesList,url){
    const routes =  Object.keys(enhancedRoutesList)
    const found = routes.find(v => url.includes(v));
    if (found){
        extconsole.log('content:getRouteHandler',found)
        return found
    }
}

/**
 * Remove left over views from other routes (need for SPAs)
 * @param {} routeName 
 */
function cleanUpEnhancedRouteView(routeName){
    extconsole.log('content:cleanUpEnhancedRouteView')
    jQuery(`#pwp_${routeName}`).remove();
}

/**
 * Triggers actual routehandler
 * @param {} routeHandler 
 */
function triggerRouteHandler(routeHandler){
    Object.keys(enhancedRoutesList).forEach((routeName) => {cleanUpEnhancedRouteView(routeName)});
    if (routeHandler){
        extconsole.log('content:triggerRouteHandler',routeHandler)
        enhancedRoutesList[routeHandler]()
    }
}

function getUser(){
    var url = 'https://app.getblueshift.com/api/v1/accounts/get_user'
    if (window.location.toString().indexOf('release3') > -1) {
        url = 'https://release3.getblueshift.com/api/v1/accounts/get_user'
    }
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function(res) {
            if (res['role'] === 'SuperAdmin'){
                loadPlugin()
            } else {
                extconsole.log('Internal tools only for superadmins!')
            }
        },
        error: function(errors){
            extconsole.error('getUser Error',errors)
        }
    });
}

function getAndSetAccountInfo(cb){
    $.ajax({
        url: "https://app.getblueshift.com/api/v1/accounts",
        type: 'GET',
        dataType: 'json',
        success: function(response){
            ACCOUNT_UUID = response["account"]["uuid"]
            chrome.storage.sync.set({"accountIdKey": ACCOUNT_UUID})
            extconsole.log("Update account id",ACCOUNT_UUID)
            cb(null)
        },
        error: function(error){
            extconsole.error("getAndSetAccountInfo",error)
            cb(error)
        }
    })
}

function getAndSetDebugQueryParam(){
    var parseQueryString = function( queryString ) {
        var params = {}, queries, temp, i, l;
        // Split into key/value pairs
        queries = queryString.split("&");
        // Convert the array of strings into an object
        for ( i = 0, l = queries.length; i < l; i++ ) {
            temp = queries[i].split('=');
            params[temp[0]] = temp[1];
        }
        return params;
    };
    const url = window.location.href
    const queryString = url.substring( url.indexOf('?') + 1 );
    const queryParams = parseQueryString(queryString)
    // console.log('setting query param',queryParams)
    if (queryParams["extdebug"] && queryParams["extdebug"] === 'true'){
        extconsole.log('setting query param',queryParams["extdebug"])
        EXT_DEBUG = true
    } else {
        EXT_DEBUG = false
    }
}

function loadPlugin(){
    extconsole.log("loadPlugin: start")
    getAndSetAccountInfo(function(){
        getAndSetDebugQueryParam()
        loadHelperScriptToActualPageDom()
        // Display sidebar internal tools meniu
        add_sidebar_menu()
        // trigger route handler on page load
        triggerRouteHandler(getRouteHandler(enhancedRoutesList,window.location.toString()))
        // Event listener to get client side routing change notification
        // trigger route handler on client side routing chaged
        document.addEventListener('bsft_dashboard_powerpack', function(e){
            if (e.detail.eventName === 'onClientUrlChanged'){
                extconsole.log('bsft_dashboard_powerpack:content:listener:onClientUrlChanged',e.detail.url)
                getAndSetDebugQueryParam()
                triggerRouteHandler(getRouteHandler(enhancedRoutesList,e.detail.url))
            }
        })
    })
    
}

$(window).on('load', function(){
    getAndSetDebugQueryParam()
});

loadPlugin()