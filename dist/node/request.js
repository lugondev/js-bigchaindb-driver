"use strict";

var _Object$keys = require("@babel/runtime-corejs3/core-js-stable/object/keys");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols");

var _filterInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/filter");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/for-each");

var _Object$getOwnPropertyDescriptors = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js-stable/object/define-properties");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs3/regenerator"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _now = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/date/now"));

var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-timeout"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _baseRequest = _interopRequireDefault(require("./baseRequest"));

var _sanitize = _interopRequireDefault(require("./sanitize"));

function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); if (enumerableOnly) { symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context3; _forEachInstanceProperty(_context3 = ownKeys(Object(source), true)).call(_context3, function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (_Object$getOwnPropertyDescriptors) { _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)); } else { var _context4; _forEachInstanceProperty(_context4 = ownKeys(Object(source))).call(_context4, function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } } return target; }

var DEFAULT_REQUEST_CONFIG = {
  headers: {
    'Accept': 'application/json'
  }
};
var BACKOFF_DELAY = 500; // 0.5 seconds

var ERROR_FROM_SERVER = 'HTTP Error: Requested page not reachable';
/**
 * @private
 * Small wrapper around js-utility-belt's request that provides url resolving,
 * default settings, and response handling.
 */

var Request = /*#__PURE__*/function () {
  function Request(node) {
    (0, _classCallCheck2.default)(this, Request);
    this.node = node;
    this.backoffTime = null;
    this.retries = 0;
    this.connectionError = null;
  }

  (0, _createClass2.default)(Request, [{
    key: "request",
    value: function () {
      var _request = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee2(urlPath, config, timeout, maxBackoffTime) {
        var _this = this;

        var requestConfig, apiUrl, backoffTimedelta, errorObject, requestTimeout;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (urlPath) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return", _promise.default.reject(new Error('Request was not given a url.')));

              case 2:
                // Load default fetch configuration and remove any falsy query parameters
                requestConfig = _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, this.node.headers), DEFAULT_REQUEST_CONFIG), config), {}, {
                  query: config.query && (0, _sanitize.default)(config.query)
                });
                apiUrl = this.node.endpoint + urlPath;

                if (requestConfig.jsonBody) {
                  requestConfig.headers = _objectSpread(_objectSpread({}, requestConfig.headers), {}, {
                    'Content-Type': 'application/json'
                  });
                } // If connectionError occurs, a timestamp equal to now +
                // `backoffTimedelta` is assigned to the object.
                // Next time the function is called, it either
                // waits till the timestamp is passed or raises `TimeoutError`.
                // If `ConnectionError` occurs two or more times in a row,
                // the retry count is incremented and the new timestamp is calculated
                // as now + the `backoffTimedelta`
                // The `backoffTimedelta` is the minimum between the default delay
                // multiplied by two to the power of the
                // number of retries or timeout/2 or 10. See Transport class for that
                // If a request is successful, the backoff timestamp is removed,
                // the retry count is back to zero.


                backoffTimedelta = this.getBackoffTimedelta();

                if (!(timeout != null && timeout < backoffTimedelta)) {
                  _context2.next = 9;
                  break;
                }

                errorObject = {
                  message: 'TimeoutError'
                };
                throw errorObject;

              case 9:
                if (!(backoffTimedelta > 0)) {
                  _context2.next = 12;
                  break;
                }

                _context2.next = 12;
                return Request.sleep(backoffTimedelta);

              case 12:
                requestTimeout = timeout ? timeout - backoffTimedelta : timeout;
                return _context2.abrupt("return", (0, _baseRequest.default)(apiUrl, requestConfig, requestTimeout).then( /*#__PURE__*/function () {
                  var _ref = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee(res) {
                    return _regenerator.default.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _this.connectionError = null;
                            return _context.abrupt("return", res.json());

                          case 2:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee);
                  }));

                  return function (_x5) {
                    return _ref.apply(this, arguments);
                  };
                }()).catch(function (err) {
                  // ConnectionError
                  _this.connectionError = err;
                }).finally(function () {
                  _this.updateBackoffTime(maxBackoffTime);
                }));

              case 14:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function request(_x, _x2, _x3, _x4) {
        return _request.apply(this, arguments);
      }

      return request;
    }()
  }, {
    key: "updateBackoffTime",
    value: function updateBackoffTime(maxBackoffTime) {
      if (!this.connectionError) {
        this.retries = 0;
        this.backoffTime = null;
      } else if (this.connectionError.message === ERROR_FROM_SERVER) {
        // If status is not a 2xx (based on Response.ok), throw error
        this.retries = 0;
        this.backoffTime = null;
        throw this.connectionError;
      } else {
        // Timeout or no connection could be stablished
        var backoffTimedelta = Math.min(BACKOFF_DELAY * Math.pow(2, this.retries), maxBackoffTime);
        this.backoffTime = (0, _now.default)() + backoffTimedelta;
        this.retries += 1;

        if (this.connectionError.message === 'TimeoutError') {
          throw this.connectionError;
        }
      }
    }
  }, {
    key: "getBackoffTimedelta",
    value: function getBackoffTimedelta() {
      if (!this.backoffTime) {
        return 0;
      }

      return this.backoffTime - (0, _now.default)();
    }
  }], [{
    key: "sleep",
    value: function sleep(ms) {
      return new _promise.default(function (resolve) {
        return (0, _setTimeout2.default)(resolve, ms);
      });
    }
  }]);
  return Request;
}();

exports.default = Request;