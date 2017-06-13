# swint-proc-ops

[![Greenkeeper badge](https://badges.greenkeeper.io/Knowre-Dev/swint-proc-ops.svg)](https://greenkeeper.io/)
Process operator for Swint

**Warning: This is not the final draft yet, so do not use this until its official version is launched**

## Installation
```sh
$ npm install --save swint-proc-ops
```

## Options
* `server`
  * `enabled`: `Boolean`, default: `false`
  * `port`: `Number`, default: `33233`
  * `secure`: `Boolean`, default: `true`
  * `http2`: `Boolean`, default: `false`
  * `pass`: `String`, default: `''`
  * `certs`
    * `key`: `String`, default: `''`
    * `cert`: `String`, default: `''`
    * `ca`: `Array`, default: `[]`
* `keyBind`
  * `enabled`: `Boolean`, default: `false`
  * `monitor`: `String`, default: `'m'`
  * `softReset`: `String`, default: `'s'`
  * `hardReset`: `String`, default: `'r'`

## Usage
```javascript
swintProcOps({
	server: {
		enabled: true
	},
	keyBind: {
		enabled: true
	}
}, function() {
	// When operator is ready...
});
```
