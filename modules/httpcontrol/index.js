import { EventEmitter } from 'events';
import http from 'http';
import querystring from 'querystring';

/**
 * Receives http requests from another peer.
 */
class HttpControl extends EventEmitter {
    /**
     * Construcs new instance.
     * 
     * @param {integer} port - listening port for http server
     * @class
     */
    constructor(port) {
        super();
        this.started = true;
        this.server = http.createServer((req, res) => {
            if (this.started) {
                /*  HTTP request format: 
        curl --data "command=<command.type>&args=<arguments>" <targetURL>
                 */
                console.log('HTTP request received');
                let body = '';
                let query;

                req.on('data', data => {
                    body += data;
                });
                req.on('end', () => {
                    query = querystring.parse(body);
                    this.on('response', (success, message) => {
                        if (success) {
                            console.log('Command execution success');
                            res.writeHead(200);
                            res.end(message);
                        } else {
                            console.log('Command execution failed');
                            res.writeHead(400);
                            res.end(message);
                        }
                    });

                    this.emit('command', query.command, query.args);
                });
            } else {
                console.log('Server disabled');
                res.writeHead(503);
                res.end('Service Unavailable\n');
            }
        });
        this.server.listen(port, () => {
            console.log('Server listening at port %d', port);
        });
    }

    /**
     * Event listener for join conference request.
     * 
     * @param {Function} callback - callback function
     * @returns {void}
     */
    onReceivedCommand(callback) {
        return this.on('command', (type, args) => {
            callback(type, args);
        });
    }

    /**
     * Send command execution result to the client.
     *
     * @param {boolean} status - true if execution is success
     * @param {string} message - response messsage
     * @returns {void}
     */
    sendResponse(status, message) {
        this.emit('response', status, message);
    }

    /**
     * Disposes the http server.
     * 
     * @returns {void}
     */
    dispose() {
        this.server = null;
        this.started = false;
        this.removeListener('command');
        this.removeListener('response');
    }
}

export default HttpControl;
