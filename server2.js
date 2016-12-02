var express = require("express");
var bodyParser = require("body-parser");
var cookieCoder = require("cookie");
var cookieSigner = require("cookie-signature");

PORT = 8080;
SECRET = "CrossingFingers";

var app = express();

// allow cross origin access
app.options("/SnapCloud", function (req, res, next) {
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", req.get("Origin"));
    res.header("Access-Control-Allow-Headers", "Content-Type, SESSIONGLUE");
    res.header("Access-Control-Expose-Headers", "SESSIONGLUE");
    res.header("Cache-Control", "no-store");
    res.sendStatus(200);
});

services = {
    "saveProject": {
        parameters: ["ProjectName", "SourceCode", "Media", "SourceSize", "MediaSize"],
        method: "Post"
    },
    "logout": {
        parameters: [],
        method: "Get"
    }
};

function formatAPI() {
    return Object.keys(services).map(function (name) {
        var service = services[name],
            ret;

        ret = "Service=" + name;
        ret += "&Parameters=" + service.parameters.join(",");
        ret += "&Method=" + service.method;
        ret += "&URL=" + name;

        return ret;
    }).join(" ");
}

// to decode req.body fields
app.use(bodyParser.json());

// Login service
app.post("/SnapCloud", function (req, res) {
    var user = req.body.__u,
        hash = req.body.__h;

    var api = formatAPI();

    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", req.get("Origin"));
    res.header("Access-Control-Expose-Headers", "MioCracker, SESSIONGLUE");
    res.header("Cache-Control", "no-store");

    var cookieValue = "hello";
    var cookie = cookieCoder.serialize(
        "snap",
        cookieSigner.sign(cookieValue, SECRET), {
            httpOnly: true
        });
    console.log(cookie);

    res.header("MioCracker", cookie);
    res.header("Set-Cookie", cookie);

    res.send(api);
});

// serve static files
app.use(express.static(__dirname));

// start the server
app.listen(PORT, function () {
    console.log("listening on port " + PORT);
});