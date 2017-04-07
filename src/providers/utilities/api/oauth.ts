import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

import { Settings } from '../app-settings';

@Injectable()
export class Oauth {

	constructor() {}

	parseUrl(url: string) {
		let urlParts: string[] = url.split('?');
		let baseUrl: string = urlParts[0];
		let params: any = {};

		if (urlParts.length > 1) {
			let pairs: string[] = urlParts[1].split('&');
			for (let i = 0; i < pairs.length; i++) {
				let pair: string[] = pairs[i].split('=');
				params[pair[0]] = pair[1] ? pair[1] : '';
			}
		}
		return { baseUrl: baseUrl, params: params };
	}

	combineHash(origHash: any, newHash: any): Object {
		let hashString: string = JSON.stringify(origHash);
		let hash: any = JSON.parse(hashString);

		for (let key in newHash) {
			hash[key] = newHash[key];
		}
		return hash;
	}

	generateOauthSignature(httpMethod: string, url: string, params: any): string {
		let baseString: string = '';
		baseString += httpMethod.toUpperCase();
		baseString += '&' + this.Rfc3986(url);
		baseString += '&' + this.Rfc3986(this.normalize(params));

		let signingKey: string = Settings.oAuth.consumer.secret + '&';    //no need for TOKEN_SECRET

		return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(baseString, signingKey));
	}

	normalize(params: any): string {
		//sort the keys
		let sortedKeys: any[] = [];
		for (let key in params) {
			if (params.hasOwnProperty(key)) {
				let encodedKey: string = this.Rfc3986(key);
				sortedKeys.push(encodedKey);
			}
			sortedKeys.sort();
		}

		//concatenate
		let normalizedParameters = [];
		for (let i = 0; i < sortedKeys.length; i++) {
			let key: string = decodeURIComponent(sortedKeys[i]);
			normalizedParameters.push( key + '=' + params[key] );
		}
		return normalizedParameters.join('&');
	}

	Rfc3986(decoded: string): string {
		if (!decoded) {
			return '';
		}
		return encodeURIComponent(decoded)
		.replace(/!/g, '%21')
		.replace(/\*/g, '%2A')
		.replace(/\(/g, '%28')
		.replace(/\)/g, '%29')
		.replace(/\'/g, '%27');
	}

	addOauthParameters(): Object {
		let params: any = {};
		params['oauth_consumer_key'] = Settings.oAuth.consumer.key;
		params['oauth_token'] = '';
		params['oauth_nonce'] = this.createNonce(32);
		params['oauth_signature_method'] = Settings.oAuth.signatureMethod;
		params['oauth_timestamp'] = Math.round((new Date()).getTime() / 1000);
		params['oauth_version'] = Settings.oAuth.version;
		return params;
	}

	createNonce(howMany: number): string {
		howMany = howMany || 32;
		let res: string[] = [];
		let chars: string = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';

		for (let i: number = 0; i < howMany; i++) {
			res.push(chars[Math.round((Math.random() * chars.length))]);
		};

		return res.join('');
	}
}
