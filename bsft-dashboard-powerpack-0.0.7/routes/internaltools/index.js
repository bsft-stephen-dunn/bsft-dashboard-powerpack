var account_uuid ;
/**
 * Make authenticated and Authozied call to BS backend
 * @param {} account_uuid 
 */
function getSchema(account_uuid){
     var url = 'https://app.getblueshift.com/api/v1/segments/get_schema.json'
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json', // added data type
        headers: {"x-www-account-uuid": account_uuid},
        success: function(res) {
            var parsedSchema = parseSchema(res)
            loadTable('#schematbl',parsedSchema)
        },
        error: function(errors){
            extconsole.log('err',errors)
        }
    });
}

/**
 * Get Events rules for a given account
 * @param {string} account_uuid 
 */
function getRules(account_uuid){
    $.ajax({
        url: "https://app.getblueshift.com/api/v1/event_processing_rules.json",
        type: 'GET',
        dataType: 'json', // added data type
        headers: {"x-www-account-uuid": account_uuid},
        success: function(eventRules) {
            eventRules.forEach(function(row){
                row['rule'] = JSON.stringify(row['rule'],null,4)
                row['transformation'] = JSON.stringify(row['transformation'],null,4)
                row['action'] = JSON.stringify(row['action'],null,4)
            })
            loadTable('#eventrulestbl',eventRules)            
        },
        error: function(errors){
            extconsole.error('err',errors)
        }
    }); 
   
}

/**
 * Get Account level settings
 */
 function getAccountSettings(){
    $.ajax({
        url: "https://app.getblueshift.com/api/v1/accounts",
        type: 'GET',
        dataType: 'json',
        success: function(res) {
            var flattenedResponse = flattenJSON(res)
            const accountSchema = []
            const filterOutAttributes = [
                'account.account_attribute.s3_credentials.username',
                'account.account_attribute.s3_credentials.access_key',
                'account.account_attribute.s3_credentials.secret_access_key'
            ]
            for (var key in flattenedResponse){
                if (filterOutAttributes.includes(key) === false) {
                    accountSchema.push({'key':key,'value':flattenedResponse[key]})
                }
            }
            loadTable('#accounttbl',accountSchema)
        },
        error: function(errors){
            extconsole.error('err',errors)
        }
    });
}

function loadTable(tableId,data){
    $(tableId).bootstrapTable('destroy').bootstrapTable({
        data: data,
        exportDataType: 'Export All',
        exportTypes: ['json', 'xml', 'csv', 'txt', 'sql', 'excel', 'pdf'],
        pagination: true,
        pageSize: 50, //specify 5 here
        pageList: [5, 10, 25, 50, 100, 200]//list can be specified here
    });
    $(tableId).bootstrapTable('refreshOptions', {
        exportDataType: "all"
    });
}
/**
 * Flatten JSON. 
 * Example:-
 * 
 * const obj = {
   "one": 1,
   "two": {
      "three": 3
   }
   };
    {
    one: 1,
   'two.three': 3,
    }
 * @param {*} obj 
 * @param {*} res 
 * @param {*} extraKey 
 * @returns 
 */
function flattenJSON(obj = {}, res = {}, extraKey = ''){
    for(key in obj){
        if(typeof obj[key] !== 'object'){
            res[extraKey + key] = obj[key];
        }else{
            flattenJSON(obj[key], res, `${extraKey}${key}.`);
        };
    };
    return res;
};

/**
 * Temp function that returns hardcoded rules in case release3 end point is overwritten
 */
function add_event_rules(){
    fetch(chrome.extension.getURL('routes/internaltools/rules.json'))
    .then((response) => response.json()) //assuming file contains json
    .then((eventRules) => {
        eventRules.forEach(function(row){
            row['rule'] = JSON.stringify(row['rule'],null,4)
            row['transformation'] = JSON.stringify(row['transformation'],null,4)
            row['action'] = JSON.stringify(row['action'],null,4)
        })
        loadTable('#eventrulestbl',eventRules)
    });
  
}

/**
 * Returns current account name
 * @returns {string} account name
 */
function getSiteName(){
    return $('#vue-app-comp > div.app-content > div.app-header.bg-white.header > div.account-settings.bg-ghost-white > div > div.account-settings-site.color-gray-800').text()
}

/**
 * Converts schema response from api to grid digestable model
 * @param {any} schemaResponse 
 * @returns {any} modelled schema
 */
function parseSchema(schemaResponse){
    var finalSchemaModel = []
    var eventsSchema = schemaResponse['schema']['events']['data']
    for (var key in eventsSchema){
        for (var prop in eventsSchema[key]) {
            if (!prop.startsWith('_bsft')){
                var row = {}
                row['type'] ='event'
                row['name'] = key
                row['attributeName'] = prop
                row['attributeDatatype'] = eventsSchema[key][prop]
                finalSchemaModel.push(row)
                }
                
            }
        
    }
    var userAttributes =  schemaResponse['schema']['user_attributes']
    for (var key in userAttributes){
        var row = {}
        row['type'] ='user_attributes'
        row['name'] = ''
        row['attributeName'] = key
        row['attributeDatatype'] = userAttributes[key]
        finalSchemaModel.push(row)
    }
    var userCustomAttributes =  schemaResponse['schema']['user_attributes']['custom_attributes']
    for (var key in userCustomAttributes){
        var row = {}
        row['type'] ='user_attributes'
        row['name'] = 'custom_attributes'
        row['attributeName'] = key
        row['attributeDatatype'] = userCustomAttributes[key]
        finalSchemaModel.push(row)
    }
    return finalSchemaModel
}

function getEventsWhitelistAttributes(account_uuid){
    $.ajax({
        url: "https://app.getblueshift.com/api/v1/custom_events",
        type: 'GET',
        dataType: 'json',
        headers: {"x-www-account-uuid": account_uuid},
        success: function(res) {
            res = res.filter(function(item){
                return item["user_attributes_whitelist"] && item["user_attributes_whitelist"].length > 0
            })
            loadTable('#eventwhitelistbl',res)
        },
        error: function(errors){
            extconsole.error('err',errors)
        }
    });
}

/**
 * Main function that create and loads internal tools page content
 */
function internalToolsHandler(){
    extconsole.log('internalToolsHandler:start')
    jQuery( "#pwp_internaltools" ).remove()
    fetch(chrome.extension.getURL('routes/internaltools/index.html'))
    .then(response => response.text())
    .then(data => {
        jQuery( ".content" ).append(data)
        jQuery('#features a').on('click', function (e) {
            e.preventDefault()
            $(this).tab('show')                    
        })
        jQuery('#schematab').on('click', function (e) {
            e.preventDefault()
            $(this).tab('show')
            getSchema(account_uuid)            
        })
        jQuery('#accounttab').on('click', function (e) {
            e.preventDefault()
            $(this).tab('show')
            getAccountSettings(account_uuid)            
        })
        jQuery('#accountconfigsub a').on('click', function (e) {
            var tabName = $(this).attr('href')
            e.preventDefault()
            $(this).tab('show')
            if (tabName === "#eventwhitelist"){
                getEventsWhitelistAttributes(account_uuid)
            }
            if (tabName === "#schema"){
                getSchema(account_uuid)
            }
            if (tabName === "#settings"){
                getAccountSettings(account_uuid)
            }
        })
    }).catch(err => {
        extconsole.error('internalToolsHandler:err',err)
    }); 
    // default view of internal tools
    getRules()
}