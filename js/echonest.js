(function ($, window, undefined) {

    function EchoNest() {
        this.echonestKey = "HRKVFLJESXBJLUDBQ";
    }
    
    EchoNest.prototype.makeRequest = function (method, args, callback) {
        var self = this;
        
        args.api_key = self.echonestKey;
        args.format = 'jsonp';
        
        console.log("ECHONEST: " + "http://developer.echonest.com/api/v4/" + method, args);
        $.ajax({
            dataType: "jsonp",
            cache: false,
            data: args,
            traditional: true,
            type: 'GET',
            url: "http://developer.echonest.com/api/v4/" + method,
            success: function (data) {
                console.log("ECHONEST: Received data", data);
                if (self.checkResponse(data)) {
                    callback(data.response);
                } else {
                    console.error("ECHONEST: makeRequest bailed");
                }
            },
            error: function (jqxhr, textStatus, errorThrown) {
                console.error("ECHONEST: Problem making request", jqxhr); 
                console.error(textStatus);
                console.error(errorThrown);
            }		
        });
    }

    EchoNest.prototype.checkResponse = function (data) {
        if (data.response) {
            if (data.response.status.code != 0) {
                console.error("Error from EchoNest: " + data.response.status.message);
            } else {
                return true;
            }
        } else {
            console.error("Unexpected response from server");
        }
        
        return false;
    }
    
    window.EchoNest = EchoNest;
 } (jQuery, window));