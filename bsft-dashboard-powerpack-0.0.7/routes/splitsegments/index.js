// attributes :- 
// pending add tool to show possible values

function splitsegmentsHandler(){
    extconsole.log('splitsegmenthandler:start')
    fetch(chrome.extension.getURL('routes/splitsegments/index.html'))
    .then(response => response.text())
    .then(html => {
            jQuery( ".content" ).prepend(html)
            addDynamicSelectElements()
            extconsole.log('i am using extconsole')
            getCustomUserLists(function(err,userLists){
                if (err){
                    extconsole.log('getCustomUserLists',err)
                } else {
                    let listNames = []
                    userLists.forEach(element => {
                        listNames.push(element['filename'])
                    });
                    // minjar list name is breaking
                    // name = name.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
                    // not easy to fix and underlying stuff will break
                    if (ACCOUNT_UUID && ACCOUNT_UUID === "51f77d04-bb9c-4e45-8e8a-8d4a3e109f08") {
                        extconsole.log('Minjar Account')
                        listNames = listNames.splice(0,15)
                    }
                    listNames.forEach((name) => {
                        $('#sel_list').append(`<option value="${name}"> ${name}</option>`);
                    })
                }
            })
            getAutoCompleteAttributesWithValues(function(err,attributesWithValues){
                if (err){
                    extconsole.log('getAutoCompleteAttributesWithValues Err',err)
                } else {
                    attributeValueDB = attributesWithValues
                    attributesWithValues.forEach(function(row){
                        $('#sel_attributes').append(`<option data-toggle="tooltip" title='${row.values.length > 0 ? row.values.join(",") : ""}' > ${row.attribute}</option>`);
                    })
                }
            }) 
            jQuery('#submitSplitSegment').on('click', function (e) {
                e.preventDefault()
                createNewSplitSegments(function(err,newCreatedSegments){
                    if (err){
                        extconsole.error('createNewSplitSegments err:',err)
                    } else {
                        extconsole.log('filtered Segments',newCreatedSegments)
                        displaySegmentsInGrid(newCreatedSegments)
                    }
                })
            })
            jQuery("#sel_list").change(function(){
                var selectedListName = $('#sel_list').find(":selected").text().trim()   
                getSegments(function(err,allSegments){
                    if (err){
                        cb(err)
                    } else {
                        var filteredSegments = filterSegments(allSegments,selectedListName)
                        displaySegmentsInGrid(filteredSegments)
                    }
    
                })     
            });
        }).catch(err => {
            extconsole.error('splitsegmentsHandler:',err)
        }); 
}

function displaySegmentsInGrid(segments){
    $("#tbl_splitsegments").css("visibility", "hidden");
    $("#tbl_splitsegments").bootstrapTable('destroy');
    if (segments.length > 0) {
        $('#tbl_splitsegments').bootstrapTable({
            data: segments,
            formatLoadingMessage: function() {
                return '<b>This is a custom loading message...</b>';
            },
            exportDataType: 'Export All',
            exportTypes: ['json', 'xml', 'csv', 'txt', 'sql', 'excel', 'pdf'],
            pagination: true,
            pageSize: 50, //specify 5 here
            pageList: [5, 10, 25, 50, 100, 200]//list can be specified here
        });
        $("#tbl_splitsegments").css("visibility", "visible");
    }
}

function checkHTML(html) {
    var doc = document.createElement('div');
    doc.innerHTML = html;
    return ( doc.innerHTML === html );
}

function createNewSplitSegments(cb){
    $('#tbl_splitsegments').bootstrapTable('destroy')
    $("#tbl_splitsegments").css("visibility", "hidden");
    extconsole.log('calling createNewSplitSegments')
    var selectedList = $('#sel_list').find(":selected").text().trim();
    var selectedAttributes = []
    const selectedAttributeElements = document.querySelectorAll(".select-attributes");
    selectedAttributeElements.forEach(function(userItem) {
        selectedAttributes.push($(userItem).find(":selected").text().trim())
    });
    extconsole.log('selectedAttributes',selectedAttributes)
    createSplitSegments(selectedList,selectedAttributes,function(err,result){
        if (err){
            cb(err)
        } else {
            getSegments(function(err,allSegments){
                if (err){
                    cb(err)
                } else {
                    var filteredSegments = filterSegments(allSegments,selectedList)
                    cb(null,filteredSegments)
                }
            })
        }
    })  
}

function getCustomUserLists(cb){
    extconsole.log('calling getCustomUserLists')
    async.waterfall([
        async.apply(bsftChromeExtCore.getKeyFromStorage, 'accountIdKey'),
        function(accountIdKey,callback){
            bsftChromeExtCore.getApiData(accountIdKey,"https://app.getblueshift.com/api/v1/custom_user_lists.json",callback)
        },
        function(userLists,callback){
            callback(null,userLists)
        }
    ],cb)
}

function getSegments(cb){
    extconsole.log('calling getSegments')
    async.waterfall([
        async.apply(bsftChromeExtCore.getKeyFromStorage, 'accountIdKey'),
        function(accountIdKey,callback){
            bsftChromeExtCore.getApiData(accountIdKey,"https://app.getblueshift.com/api/v1/segments.json",callback)
        }
    ],cb)
}

function filterSegments(allSegments,prefix){
    return allSegments.filter((segment) => {
        return segment["name"].startsWith(prefix)
    })
}

function createDummySplitSegments(listName,attribute){
    var newSegments = []
    var lists = {
        "Team": ["Buffalo Bills",
        "New York Giants",
        "New York Jets",
        "Jacksonville Jaguars",
        "Miami Dolphins",
        "Tampa Bay Buccaneers",
        "Los Angeles Rams",
        "Los Angeles Chargers",
        "San Francisco 49ers",
        "Dallas Cowboys",
        "Houston Texans",
        "Philadelphia Eagles",
        "Pittsburgh Steelers",
        "Cincinnati Bengals",
        "Cleveland Browns",
        "Baltimore Ravens",
        "Washington Football Team",
        "Green Bay Packers",
        "Seattle Seahawks",
        "Tennessee Titans",
        "Carolina Panthers",
        "Las Vegas Raiders",
        "Kansas City Chiefs",
        "Minnesota Vikings",
        "Detroit Lions",
        "New England Patriots",
        "New Orleans Saints",
        "Indianapolis Colts",
        "Chicago Bears",
        "Atlanta Falcons",
        "Denver Broncos",
        "Arizona Cardinals"],
        "Site" : ["nflstore","Fanatics.com","warriors.com","nba.com"] 
    }
    console.log('attribute',attribute,attribute === "Team")
    var finalList = ( attribute === "Team") ? lists["Team"] : lists["Site"]
    finalList.forEach(function(item){
        var segment = {
            "name" : listName + " - " + item,
            "updated_at": (new Date()).toLocaleString(),
            "approxusers": 2,
            "email_users": 2,
            "push_users": 0,
            "facebook_users": 0,
            "approxusers_updated_at": "2022-01-27T02:43:19.000Z",
            "is_exported_users": false,
            "sms_users": 1,
            "is_uploading": false,
            "hidden": false,
            "in_app_users": 0,
            "archived": false,
            "refresh_status": "ready",
            "author": " - ",
            "segment_type": "basic"
        }
        newSegments.push(segment)

                        
    })
    return newSegments
}

function getAutoCompleteAttributes(cb){
    extconsole.log('calling getAutoCompleteAttributes')
    async.waterfall([
        async.apply(bsftChromeExtCore.getKeyFromStorage, 'accountIdKey'),
        function(accountIdKey,callback){
            bsftChromeExtCore.getApiData(accountIdKey,"https://app.getblueshift.com/api/v1/accounts",callback)
        },
        function(result,callback){
            var attrributes = []
            if (result['account'] && result['account']['account_attribute']['autocomplete_configuration']){
                const whitelist = result['account']['account_attribute']['autocomplete_configuration']['whitelist']
                if (whitelist){
                    whitelist.forEach(function(item){
                        attrributes.push(item.split("\\.").pop())
                    })
                }
                cb(null,attrributes)
            } else {
                cb(null,attrributes)
            }
        }
    ],cb)
}

function getAutoCompleteValuesByAttribute(attributeName,cb){
    extconsole.log('calling getAutoCompleteValuesByAttribute')
    async.waterfall([
        async.apply(bsftChromeExtCore.getKeyFromStorage, 'accountIdKey'),
        function(accountIdKey,callback){
            bsftChromeExtCore.getApiData(accountIdKey,`https://app.getblueshift.com/api/v1/segments/get_autocomplete_attributes.json?attribute=custom_attributes.${attributeName}&table=custom`,callback)
        }
    ],function(err,result){
       if (err){
           cb(err)
       } else {
           cb(null,{"attribute":attributeName,values:result})
       }
    })

}

function addDynamicSelectElements(){
    $(document).on('click', '.btn-add', function(event) {
        event.preventDefault();
        var controlForm = $('.controls');
        var currentEntry = $(this).parents('.entry:first');
        var newEntry = $(currentEntry.clone()).appendTo(controlForm);
        newEntry.find('input').val('');
        controlForm.find('.entry:not(:last) .btn-add')
                .removeClass('btn-add').addClass('btn-remove')
                .removeClass('btn-success').addClass('btn-danger')
                .html('<span class="glyphicon glyphicon-minus"></span>');
                
        var inputs = $('.controls .form-control');
        $.each(inputs, function(index, item) {
          item.name = 'emails[' + index + ']';
        });
    });
    $(document).on('click', '.btn-remove', function(event) {
    event.preventDefault();
    $(this).parents('.entry:first').remove();
    var inputs = $('.controls .form-control');
    $.each(inputs, function(index, item) {
        item.name = 'emails[' + index + ']';
    });
    }); 
    $(document).on('click', '.btn-remove', function(event) {
        event.preventDefault();
    });
}

function getAutoCompleteAttributesWithValues(cb){
    async.waterfall([
        function(cb){
            getAutoCompleteAttributes(cb)
        },
        function(attributes,lcb){
            async.map(attributes,getAutoCompleteValuesByAttribute,lcb)
        }
    ],cb)
}

function createSplitSegments(listName,selectedAttributes,createSplitSegmentsCb){
    // get user list id
    extconsole.log('createSplitSegments')
    async.series([
        function(cb){
            getCustomUserLists(cb)
        },
        function(cb){
            getAutoCompleteAttributesWithValues(cb)
        }
    ],function (err,result){
        if (err){
            createSplitSegmentsCb(err)
        } else {
            var customerList = result[0]
            var attributeValues = result[1]
            var customerListId = customerList.find(function(item) {
                return item["filename"] === listName
            })["id"]
            var selectedAttributesWithValuesFlattened = attributeValues.filter(function(item){
                return selectedAttributes.includes(item["attribute"])
            }).map(parser.flattenValues)
            extconsole.log('createSplitSegments', customerListId,JSON.stringify(selectedAttributesWithValuesFlattened))
            var mergedAttributeValueList = parser.mergeAttributeValues(selectedAttributesWithValuesFlattened)
            extconsole.log('createSplitSegments2',mergedAttributeValueList)

            async.eachLimit(mergedAttributeValueList,1,function(attributeList,eachLimitCb){
                var segmentConfig = getSegmentCreateConfig(listName,customerListId,attributeList)
                // create segment by issuing post
                extconsole.log('segmentConfig',JSON.stringify(segmentConfig,null,4))
                // create segment using post call
                async.waterfall([
                    async.apply(bsftChromeExtCore.getKeyFromStorage, 'accountIdKey'),
                    function(accountIdKey,callback){
                        // to do check reponse if segment already exists with this name
                        // ignore error
                        segmentCreateRequest(
                            accountIdKey,
                            segmentConfig,
                            "POST",
                            callback)
                    }
                ],function(err,result){
                    if(err){
                        eachLimitCb(err)
                    } else {
                        eachLimitCb(null,result)
                    }
                })
            } ,function(err,res){
                if (err){
                    createSplitSegmentsCb(err)
                } else {
                    createSplitSegmentsCb(null),res
                }
            })
        }
        
    })
}

function getAttributeConditionSchema(attributeName,atttributeValue){
    return {
        "attribute": `${attributeName}`,
        "match": "is equal to",
        "value": `${atttributeValue}`,
        "operator": "AND",
        "order": 1,
        "end_time": null,
        "start_time": null,
        "timeline_attribute": null,
        "timeline_operator": null,
        "timeline_relative_operator": null,
        "timeline_relative_operator2": null,
        "timeline_unit": null,
        "timeline_unit2": null,
        "timeline_value": null,
        "timeline_value2": null
    }
}

function createSegementWithCustomListSchema(listName,listId){
    var baseSegmentConfig = {
        "segment": {
            "name": listName + '- base',
            "conditions": []
        }
    } 
    var listCondition = {
        "start_time": "",
        "end_time": "",
        "frequency": "",
        "frequency2": "",
        "operator": "AND",
        "type": "custom_lists",
        "frequency_operator": "",
        "timeline_operator": null,
        "timeline_unit": null,
        "timeline_value": "",
        "condition_class": "custom_lists",
        "components": [
            {
                "attribute": "list_id",
                "match": "terms",
                "value": `["${listId}"]`,
                "operator": "AND",
                "order": "1"
            }
        ]
    }
    baseSegmentConfig["segment"].conditions.push(listCondition)
    return baseSegmentConfig
}

function getSegmentCreateConfig(listName,listId,attributeList){
    console.log('getSegmentCreateConfig',listName,listId,attributeList)
    var baseSegmentConfig = {
        "segment": {
            "name": listName,
            "conditions": []
        }
    } 
    var listCondition = {
        "start_time": "",
        "end_time": "",
        "frequency": "",
        "frequency2": "",
        "operator": "AND",
        "type": "custom_lists",
        "frequency_operator": "",
        "timeline_operator": null,
        "timeline_unit": null,
        "timeline_value": "",
        "condition_class": "custom_lists",
        "components": [
            {
                "attribute": "list_id",
                "match": "terms",
                "value": `["${listId}"]`,
                "operator": "AND",
                "order": "1"
            }
        ]
    }
    var attributeQueryBase = {
        "start_time": "",
        "end_time": "",
        "frequency": "",
        "frequency2": "",
        "operator": "AND",
        "type": "users",
        "frequency_operator": "",
        "timeline_operator": null,
        "timeline_unit": null,
        "timeline_value": "",
        "timeline_relative_operator": null,
        "timeline_relative_operator2": null,
        "condition_class": "custom",
        "components": []
    }
    if (!Array.isArray(attributeList)){
        attributeList = [attributeList]
    }
    attributeList.forEach(function(list){
        baseSegmentConfig["segment"]["name"] = baseSegmentConfig["segment"]["name"] + " - " + list["value"]
        attributeQueryBase["components"].push(getAttributeConditionSchema(list["attribute"],list["value"]))
    })
    baseSegmentConfig["segment"].conditions.push(listCondition)
    baseSegmentConfig["segment"].conditions.push(attributeQueryBase)
    return baseSegmentConfig
}

var segmentBuilder = {

}

var parser = {
    joinLists: function (list1,list2){
        var items = []
        for (var i = 0;i <= list1.length - 1;i++){
            for (var j = 0; j <= list2.length - 1; j++){
                {}
                var item = [list1[i],list2[j]]
                items.push(item)
            }
        }
        return items
    },
    flattenValues: function (attributeValues){
                        var flattednedArray = []
                        attributeValues.values.forEach(function(value){
                            var flattenedRow = {"attribute": attributeValues["attribute"]}
                            flattenedRow["value"] = value
                            flattednedArray.push(flattenedRow)
                        })
                    return flattednedArray
    },
    mergeAttributeValues : function (arrayOfAttributeValues){
                                var combinations = arrayOfAttributeValues[0]
                                console.log('arrayOfAttributeValues.length',combinations)
                                for (var i = 1; i <= arrayOfAttributeValues.length - 1;i++){
                                    if (arrayOfAttributeValues[i].length > 0 ){
                                        combinations = parser.joinLists(combinations,arrayOfAttributeValues[i])
                                    }
                                }
                                return combinations
                            }
}

const parseCookie = str =>
  str
    .split(';')
    .map(v => v.split('='))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});

function segmentCreateRequest(accountId,payload,method,cb){
    var parsedCookie = parseCookie(document.cookie);
    $.ajax({
        url: "https://app.getblueshift.com/api/v1/segments.json",
        type: method,
        data: JSON.stringify(payload),
        traditional: true,
        headers: {
            "x-www-account-uuid": accountId,
            "accept": "application/json, text/plain, */*",  
            "content-type": "application/json;charset=UTF-8",
            "x-xsrf-token" : parsedCookie["XSRF-TOKEN"]  ,
            "dummyhead" : "dummy"
        },
        success: function(response){
            cb(null,response)},
        error: function(error){
            extconsole.error('segmentCreateRequestErr',JSON.stringify(error,null,4))
            if (error["responseJSON"]["errors"][0]["detail"] === "Name: This Segment name is already in use, please use a different name"){
                console.warn("SegmentAlreadyExists",payload["segment"]["name"])
                cb(null)
            } else {
                cb(error)
            }
        }
      });
}
