var bsftChromeExtCore = {
    getApiData: function(accountId,url,cb){
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            headers: {"x-www-account-uuid": account_uuid},
            success: function(response){cb(null,response)},
            error: function(error){cb(error)}
        })
    },
    postApiData: function(accountId,url,payload,cb){
        $.ajax({
            url: url,
            type: "POST",
            data: JSON.stringify(payload),
            traditional: true,
            headers: {
                "x-www-account-uuid": accountId,
                Accept: "application/json, text/plain, charset=utf-8",         
                "Content-Type": "application/json; charset=utf-8"   
            },
            success: function(response){cb(null,response)},
            error: function(error){cb(error)}
          });
    },
    getKeyFromStorage: function(keyName,cb){
        chrome.storage.sync.get(null,function(result){
            cb(null,result[keyName])
        })
    }
}