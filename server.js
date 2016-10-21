var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');

var baseDirectory = __dirname;
var port = 8080;

http.createServer(function (request, response) {
    try {
        var requestUrl = url.parse(request.url);
        fsPath = baseDirectory + path.normalize(requestUrl.pathname);

        response.writeHead(200);
        var fileStream = fs.createReadStream(fsPath);
        fileStream.pipe(response);
        fileStream.on('error', function (e) {
            response.writeHead(404);
            response.end();
        })
    } catch (e) {
        response.writeHead(500);
        response.end();
        console.log(e.stack);
    }
}).listen(port);

console.log("listening on port " + port);
