module.exports = function(RED) {
    "use strict";

    function Gp2iac(config) {
        RED.nodes.createNode(this,config);
        this.name = config.neme;
        this.objectkey = config.objectkey;
        this.sensortype = config.sensortype;
        this.dataname1 = config.dataname1;
        this.dataname2 = config.dataname2;
        this.dataname3 = config.dataname3;
        this.unit1 = config.unit1;
        this.unit2 = config.unit2;
        this.unit3 = config.unit3;
        var objectkey = this.objectkey;
        var sensortype = this.sensortype;
        var dataname1 = this.dataname1;
        var dataname2 = this.dataname2;
        var dataname3 = this.dataname3;
        var unit1 = this.unit1;
        var unit2 = this.unit2;
        var unit3 = this.unit3;
        var node = this;
        var dataname = [dataname1,dataname2,dataname3];
        var datavalue = new Array(3);
        var unit = [unit1,unit2,unit3];

        //イベント：msg入力が取得トリガー
        node.on('input', function(msg) {
            if(sensortype == "dht11"){
                datavalue[0] = msg.payload.temperature;
                datavalue[1] = msg.payload.humidity;
                datavalue[2] = msg.payload.heatIndex;
            }else if(sensortype == "button"){
                datavalue[0] = msg.payload;
                datavalue[1] = 0;
                datavalue[2] = 0;
            }else{
                datavalue[0] = msg.payload;
                datavalue[1] = 0;
                datavalue[2] = 0;
            }
            Gp2iacMsg(msg);
        });

        //変換ファンクション
        function Gp2iacMsg(msg){

            var dateformat = require('dateformat');
            var date = new Date();
            var timestamp = dateformat(date, 'isoDateTime');

            msg = {
                "request": "store",
                "dataObject": {
                    "objectType" : "iaCloudObject",
                    "objectKey" : objectkey ,
                    "objectDescription" : "センサーの値",
                    "timeStamp" :  timestamp,
                    "ObjectContent" : {
                        "contentType": "iaCloudData",
                        "contentData":[{
                            "dataName": dataname[0],
                            "dataValue": datavalue[0],
                            "unit": unit[0]
                        },{
                            "dataName": dataname[1],
                            "dataValue": datavalue[1],
                            "unit": unit[1]
                        },{
                            "dataName": dataname[2],
                            "dataValue": datavalue[2],
                            "unit": unit[2]
                        }]
                    }
                }
                
            }
            node.send(msg);
        }
    }
    RED.nodes.registerType('gp2iac',Gp2iac);
}
