
"use strict";

const gpiop = require('rpi-gpio').promise;
const INTERVAL = 10 * 1000;
const MINCYCLE = 1;

module.exports = function(RED) {


    function piGPIOin(config) {

        RED.nodes.createNode(this, config);

        const node = this;

        let statusTxt = "";
        let value = {};
        let preValue = {};
        const PRESENT_VALUE_TEXT = RED._("runtime.value");

        // set GPIO pin mode
        gpio.setMode(gpio.MODE_BCM);
            
        gpio.on("change", function (channel, value) {

        });
        // set GPIO pins up
        for (let dataItem in config.dataItems) 
            gpio.setup(dataItem.gpio, gpio.DIR_IN, gpio.EDGE_BOTH);

    
        // 定期収集のためのカウンターをセット
        let storeInterval = parseInt(config.storeInterval);
        let timeCount = storeInterval;

        // Nodeステータスを　Readyに
        statusTxt = RED._("runtime.waiting");

        if (storeInterval !== 0) {
            this.intervalId = setInterval(function(){
                // 設定された格納周期で,PLCCom Nodeからデータを取得し、ia-cloudオブジェクトを
                // 生成しメッセージで送出
                // 複数の周期でオブジェクトの格納をするため、1秒周期でカウントし、カウントアップしたら、
                // オブジェクト生成、メッセージ出力を行う。

                // 収集周期前であれば何もせず
                timeCount = timeCount - MINCYCLE;  
                if (timeCount > 0) return;
                
                // 収集周期がきた。収集周期を再設定。
                timeCount = storeInterval;
                iaCloudObjectSend();
                
            }, MINCYCLE * 1000);
        }

        this.on("input",function(msg) {
            if (msg.payload) iaCloudObjectSend();
        });

        this.on("close",function(done) {
            // stop status watch
            clearInterval(this.watchId);
            // stop cyclic ia-cloud object store
            clearInterval(this.intervalId);
            // just in case
            setTimeout(done, 300);
        });

        // ia-cloudオブジェクトを出力メッセージとして送出する関数
        function iaCloudObjectSend () {
            const moment = require("moment");

            if (!value) return;
            let msg = {request:"store", dataObject:{objectContent:{}}};
            let contentData = [
                {
                    dataName: config.CPUtempDataName,
                    dataValue: value.CPUtemp,
                    unit: config.CPUtempUnit
                },{
                    dataName: config.CPUinUseDataName,
                    dataValue: value.CPUinUse,
                    unit: config.CPUinUseUnit
                },{
                    dataName: config.memDataName,
                    dataValue: value.mem,
                    unit: config.memUnit
                }
            ];
            msg.dataObject.objectKey = config.objectKey;
            msg.dataObject.timestamp = moment().format();
            msg.dataObject.objectType = "iaCloudObject";
            msg.dataObject.objectDescription = config.objectDescription;
            msg.dataObject.objectContent.contentType = "iaCloudData";

            msg.dataObject.objectContent.contentData = contentData;
            // set contentData[] to msg.payload
            msg.payload = contentData;
            // Send output message to the next Nodes
            node.send(msg);
            // make Node status to "sent"
            statusTxt = RED._("runtime.sent");
            node.status({fill:"green", shape:"dot",
                text: PRESENT_VALUE_TEXT + value.CPUtemp + ":" + statusTxt});
        }
    };

    RED.nodes.registerType("pi-GPIO-in",piGPIOin);
}
