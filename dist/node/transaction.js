"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs3/regenerator"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _buffer = require("buffer");

var _jsonStableStringify = _interopRequireDefault(require("json-stable-stringify"));

var _clone = _interopRequireDefault(require("clone"));

var _bs = _interopRequireDefault(require("bs58"));

var _cryptoConditions = require("crypto-conditions");

var _ccJsonify = _interopRequireDefault(require("./utils/ccJsonify"));

var _sha256Hash = _interopRequireDefault(require("./sha256Hash"));

// Copyright BigchainDB GmbH and BigchainDB contributors
// SPDX-License-Identifier: (Apache-2.0 AND CC-BY-4.0)
// Code is Apache-2.0 and docs are CC-BY-4.0

/**
 * Construct Transactions
 */
var Transaction = /*#__PURE__*/function () {
  function Transaction() {
    (0, _classCallCheck2.default)(this, Transaction);
  }

  (0, _createClass2.default)(Transaction, null, [{
    key: "serializeTransactionIntoCanonicalString",
    value:
    /**
     * Canonically serializes a transaction into a string by sorting the keys
     * @param {Object} (transaction)
     * @return {string} a canonically serialized Transaction
     */
    function serializeTransactionIntoCanonicalString(transaction) {
      // BigchainDB signs fulfillments by serializing transactions into a
      // "canonical" format where
      var tx = (0, _clone.default)(transaction); // TODO: set fulfillments to null
      // Sort the keys

      return (0, _jsonStableStringify.default)(tx, function (a, b) {
        return a.key > b.key ? 1 : -1;
      });
    }
  }, {
    key: "makeInputTemplate",
    value: function makeInputTemplate() {
      var publicKeys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var fulfills = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var fulfillment = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      return {
        fulfillment: fulfillment,
        fulfills: fulfills,
        'owners_before': publicKeys
      };
    }
  }, {
    key: "makeTransactionTemplate",
    value: function makeTransactionTemplate() {
      var txTemplate = {
        id: null,
        operation: null,
        outputs: [],
        inputs: [],
        metadata: null,
        asset: null,
        version: '2.0'
      };
      return txTemplate;
    }
  }, {
    key: "makeTransaction",
    value: function makeTransaction(operation, asset) {
      var metadata = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var outputs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      var inputs = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
      var tx = Transaction.makeTransactionTemplate();
      tx.operation = operation;
      tx.asset = asset;
      tx.metadata = metadata;
      tx.inputs = inputs;
      tx.outputs = outputs;
      return tx;
    }
    /**
     * Generate a `CREATE` transaction holding the `asset`, `metadata`, and `outputs`, to be signed by
     * the `issuers`.
     * @param {Object} asset Created asset's data
     * @param {Object} metadata Metadata for the Transaction
     * @param {Object[]} outputs Array of Output objects to add to the Transaction.
     *                           Think of these as the recipients of the asset after the transaction.
     *                           For `CREATE` Transactions, this should usually just be a list of
     *                           Outputs wrapping Ed25519 Conditions generated from the issuers' public
     *                           keys (so that the issuers are the recipients of the created asset).
     * @param {...string[]} issuers Public key of one or more issuers to the asset being created by this
     *                              Transaction.
     *                              Note: Each of the private keys corresponding to the given public
     *                              keys MUST be used later (and in the same order) when signing the
     *                              Transaction (`signTransaction()`).
     * @returns {Object} Unsigned transaction -- make sure to call signTransaction() on it before
     *                   sending it off!
     */

  }, {
    key: "makeCreateTransaction",
    value: function makeCreateTransaction(asset, metadata, outputs) {
      var assetDefinition = {
        data: asset || null
      };

      for (var _len = arguments.length, issuers = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        issuers[_key - 3] = arguments[_key];
      }

      var inputs = (0, _map.default)(issuers).call(issuers, function (issuer) {
        return Transaction.makeInputTemplate([issuer]);
      });
      return Transaction.makeTransaction('CREATE', assetDefinition, metadata, outputs, inputs);
    }
    /**
     * Create an Ed25519 Cryptocondition from an Ed25519 public key
     * to put into an Output of a Transaction
     * @param {string} publicKey base58 encoded Ed25519 public key for the recipient of the Transaction
     * @param {boolean} [json=true] If true returns a json object otherwise a crypto-condition type
     * @returns {Object} Ed25519 Condition (that will need to wrapped in an Output)
     */

  }, {
    key: "makeEd25519Condition",
    value: function makeEd25519Condition(publicKey) {
      var json = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var publicKeyBuffer = _bs.default.decode(publicKey);

      var ed25519Fulfillment = new _cryptoConditions.Ed25519Sha256();
      ed25519Fulfillment.setPublicKey(publicKeyBuffer);
      return json ? (0, _ccJsonify.default)(ed25519Fulfillment) : ed25519Fulfillment;
    }
    /**
     * Create an Output from a Condition.
     * Note: Assumes the given Condition was generated from a
     * single public key (e.g. a Ed25519 Condition)
     * @param {Object} condition Condition (e.g. a Ed25519 Condition from `makeEd25519Condition()`)
     * @param {string} amount Amount of the output
     * @returns {Object} An Output usable in a Transaction
     */

  }, {
    key: "makeOutput",
    value: function makeOutput(condition) {
      var amount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '1';

      if (typeof amount !== 'string') {
        throw new TypeError('`amount` must be of type string');
      }

      var publicKeys = [];

      var getPublicKeys = function getPublicKeys(details) {
        if (details.type === 'ed25519-sha-256') {
          if (!(0, _includes.default)(publicKeys).call(publicKeys, details.public_key)) {
            publicKeys.push(details.public_key);
          }
        } else if (details.type === 'threshold-sha-256') {
          var _context;

          (0, _map.default)(_context = details.subconditions).call(_context, getPublicKeys);
        }
      };

      getPublicKeys(condition.details);
      return {
        condition: condition,
        amount: amount,
        public_keys: publicKeys
      };
    }
    /**
     * Create a Preimage-Sha256 Cryptocondition from a secret to put into an Output of a Transaction
     * @param {string} preimage Preimage to be hashed and wrapped in a crypto-condition
     * @param {boolean} [json=true] If true returns a json object otherwise a crypto-condition type
     * @returns {Object} Preimage-Sha256 Condition (that will need to wrapped in an Output)
     */

  }, {
    key: "makeSha256Condition",
    value: function makeSha256Condition(preimage) {
      var json = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var sha256Fulfillment = new _cryptoConditions.PreimageSha256();
      sha256Fulfillment.setPreimage(_buffer.Buffer.from(preimage));
      return json ? (0, _ccJsonify.default)(sha256Fulfillment) : sha256Fulfillment;
    }
    /**
     * Create an Sha256 Threshold Cryptocondition from threshold to put into an Output of a Transaction
     * @param {number} threshold
     * @param {Array} [subconditions=[]]
     * @param {boolean} [json=true] If true returns a json object otherwise a crypto-condition type
     * @returns {Object} Sha256 Threshold Condition (that will need to wrapped in an Output)
     */

  }, {
    key: "makeThresholdCondition",
    value: function makeThresholdCondition(threshold) {
      var subconditions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var json = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      var thresholdCondition = new _cryptoConditions.ThresholdSha256();
      thresholdCondition.setThreshold(threshold);
      (0, _forEach.default)(subconditions).call(subconditions, function (subcondition) {
        // TODO: add support for Condition
        thresholdCondition.addSubfulfillment(subcondition); // ? Should be thresholdCondition.addSubcondition(subcondition)
      });
      return json ? (0, _ccJsonify.default)(thresholdCondition) : thresholdCondition;
    }
    /**
     * Generate a `TRANSFER` transaction holding the `asset`, `metadata`, and `outputs`, that fulfills
     * the `fulfilledOutputs` of `unspentTransaction`.
     * @param {Object} unspentTransaction Previous Transaction you have control over (i.e. can fulfill
     *                                    its Output Condition)
     * @param {Object} metadata Metadata for the Transaction
     * @param {Object[]} outputs Array of Output objects to add to the Transaction.
     *                           Think of these as the recipients of the asset after the transaction.
     *                           For `TRANSFER` Transactions, this should usually just be a list of
     *                           Outputs wrapping Ed25519 Conditions generated from the public keys of
     *                           the recipients.
     * @param {...number} OutputIndices Indices of the Outputs in `unspentTransaction` that this
     *                                     Transaction fulfills.
     *                                     Note that listed public keys listed must be used (and in
     *                                     the same order) to sign the Transaction
     *                                     (`signTransaction()`).
     * @returns {Object} Unsigned transaction -- make sure to call signTransaction() on it before
     *                   sending it off!
     */
    // TODO:
    // - Make `metadata` optional argument

  }, {
    key: "makeTransferTransaction",
    value: function makeTransferTransaction(unspentOutputs, outputs, metadata) {
      var inputs = (0, _map.default)(unspentOutputs).call(unspentOutputs, function (unspentOutput) {
        var _tx$outputIndex = {
          tx: unspentOutput.tx,
          outputIndex: unspentOutput.output_index
        },
            tx = _tx$outputIndex.tx,
            outputIndex = _tx$outputIndex.outputIndex;
        var fulfilledOutput = tx.outputs[outputIndex];
        var transactionLink = {
          output_index: outputIndex,
          transaction_id: tx.id
        };
        return Transaction.makeInputTemplate(fulfilledOutput.public_keys, transactionLink);
      });
      var assetLink = {
        id: unspentOutputs[0].tx.operation === 'CREATE' ? unspentOutputs[0].tx.id : unspentOutputs[0].tx.asset.id
      };
      return Transaction.makeTransaction('TRANSFER', assetLink, metadata, outputs, inputs);
    }
    /**
     * Sign the given `transaction` with the given `privateKey`s, returning a new copy of `transaction`
     * that's been signed.
     * Note: Only generates Ed25519 Fulfillments. Thresholds and other types of Fulfillments are left as
     * an exercise for the user.
     * @param {Object} transaction Transaction to sign. `transaction` is not modified.
     * @param {...string} privateKeys Private keys associated with the issuers of the `transaction`.
     *                                Looped through to iteratively sign any Input Fulfillments found in
     *                                the `transaction`.
     * @returns {Object} The signed version of `transaction`.
     */

  }, {
    key: "signTransaction",
    value: function signTransaction(transaction) {
      var _context2;

      for (var _len2 = arguments.length, privateKeys = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        privateKeys[_key2 - 1] = arguments[_key2];
      }

      var signedTx = (0, _clone.default)(transaction);
      var serializedTransaction = Transaction.serializeTransactionIntoCanonicalString(transaction);
      (0, _forEach.default)(_context2 = signedTx.inputs).call(_context2, function (input, index) {
        var _context3;

        var privateKey = privateKeys[index];

        var privateKeyBuffer = _bs.default.decode(privateKey);

        var transactionUniqueFulfillment = input.fulfills ? (0, _concat.default)(_context3 = (0, _concat.default)(serializedTransaction).call(serializedTransaction, input.fulfills.transaction_id)).call(_context3, input.fulfills.output_index) : serializedTransaction;
        var transactionHash = (0, _sha256Hash.default)(transactionUniqueFulfillment);
        var ed25519Fulfillment = new _cryptoConditions.Ed25519Sha256();
        ed25519Fulfillment.sign(_buffer.Buffer.from(transactionHash, 'hex'), privateKeyBuffer);
        var fulfillmentUri = ed25519Fulfillment.serializeUri();
        input.fulfillment = fulfillmentUri;
      });
      var serializedSignedTransaction = Transaction.serializeTransactionIntoCanonicalString(signedTx);
      signedTx.id = (0, _sha256Hash.default)(serializedSignedTransaction);
      return signedTx;
    }
    /**
     * Delegate signing of the given `transaction` returning a new copy of `transaction`
     * that's been signed.
     * @param {Object} transaction Transaction to sign. `transaction` is not modified.
     * @param {Function} signFn Function signing the transaction, expected to return the fulfillment.
     * @returns {Object} The signed version of `transaction`.
     */

  }, {
    key: "delegateSignTransaction",
    value: function delegateSignTransaction(transaction, signFn) {
      var _context4;

      var signedTx = (0, _clone.default)(transaction);
      var serializedTransaction = Transaction.serializeTransactionIntoCanonicalString(transaction);
      (0, _forEach.default)(_context4 = signedTx.inputs).call(_context4, function (input, index) {
        var fulfillmentUri = signFn(serializedTransaction, input, index);
        input.fulfillment = fulfillmentUri;
      });
      var serializedSignedTransaction = Transaction.serializeTransactionIntoCanonicalString(signedTx);
      signedTx.id = (0, _sha256Hash.default)(serializedSignedTransaction);
      return signedTx;
    }
    /**
    * Delegate signing of the given `transaction` returning a new copy of `transaction`
    * that's been signed.
    * @param {Object} transaction Transaction to sign. `transaction` is not modified.
    * @param {Function} signFn Function signing the transaction, expected to resolve the fulfillment.
    * @returns {Promise<Object>} The signed version of `transaction`.
    */

  }, {
    key: "delegateSignTransactionAsync",
    value: function () {
      var _delegateSignTransactionAsync = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee2(transaction, signFn) {
        var _context5;

        var signedTx, serializedTransaction, serializedSignedTransaction;
        return _regenerator.default.wrap(function _callee2$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                signedTx = (0, _clone.default)(transaction);
                serializedTransaction = Transaction.serializeTransactionIntoCanonicalString(transaction);
                _context7.next = 4;
                return _promise.default.all((0, _map.default)(_context5 = signedTx.inputs).call(_context5, /*#__PURE__*/function () {
                  var _ref = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee(input, index) {
                    var fulfillmentUri;
                    return _regenerator.default.wrap(function _callee$(_context6) {
                      while (1) {
                        switch (_context6.prev = _context6.next) {
                          case 0:
                            _context6.next = 2;
                            return signFn(serializedTransaction, input, index);

                          case 2:
                            fulfillmentUri = _context6.sent;
                            input.fulfillment = fulfillmentUri;

                          case 4:
                          case "end":
                            return _context6.stop();
                        }
                      }
                    }, _callee);
                  }));

                  return function (_x3, _x4) {
                    return _ref.apply(this, arguments);
                  };
                }()));

              case 4:
                serializedSignedTransaction = Transaction.serializeTransactionIntoCanonicalString(signedTx);
                signedTx.id = (0, _sha256Hash.default)(serializedSignedTransaction);
                return _context7.abrupt("return", signedTx);

              case 7:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee2);
      }));

      function delegateSignTransactionAsync(_x, _x2) {
        return _delegateSignTransactionAsync.apply(this, arguments);
      }

      return delegateSignTransactionAsync;
    }()
  }]);
  return Transaction;
}();

exports.default = Transaction;