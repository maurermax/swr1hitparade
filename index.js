var request = require('request');
var fs = require('fs');
var async = require('async');

var SpotifyWebApi = require('spotify-web-api-node');

var clientId = 'SPOTIFY_CLIENT_ID';
var clientSecret = 'SPOTIFY_CLIENT_SECRET';
var redirectUri = 'http://localhost:5000/callback';
var PLAYLIST_URL = 'HTTPS_URL_OF_THE_SPOTIFY_PLAYLIST'
var ACCESS_TOKEN = 'ACCESS_CODE_RETRIEVED_USING_GET_ACCESS_TOKEN';
var AUTH_CODE = 'AUTH_CODE_RETRIEVED_FROM_OAUTH';

/*request('https://api.spotify.com/v1/me/playlists', {
    json: true,
    auth: {
        bearer: ACCESS_TOKEN
    }
}, function(err, res, body) {
    console.log(body);
});*/

request('https://api.spotify.com/v1/me', {
    json: true,
    auth: {
        bearer: ACCESS_TOKEN
    }
}, function(err, res, body) {
    console.log(body);
});

function getAccessToken() {
    request('https://accounts.spotify.com/api/token', {
        method: 'POST',
        form: {
            grant_type: 'authorization_code',
            code: AUTH_CODE,
            redirect_uri: redirectUri
        },
        auth: {
            username: clientId,
            password: clientSecret
        }
    }, function(err, res, body) {
        var answer = JSON.parse(body);
        console.log(answer.access_token);
    });
}

function getToplist() {
    console.log('getting tracks');
    request('http://vote.swr.de/swr/voting/abstimmung/ergebnis/h444448-0?_format=json', {
        json: true
    }, function(err, res, body) {
        fs.writeFileSync('hitparade.json', JSON.stringify(body));
        console.log('fetched json');
    });
}

function findSongs() {
    var tracks = JSON.parse(fs.readFileSync('hitparade.json'));
    async.eachLimit(tracks, 1, function(entry, cb) {
        if (entry.spotify) {
            console.log('skipping because spotify data is already presents');
            return cb();
        }
        console.log('getting spotify track for %j', entry);
        var matches = entry.artist.match(/([^\s,]+)/);
        var st = 'track:"' + entry.name + '" artist:"' + matches[1] + '"';
        console.log(st);
        request('https://api.spotify.com/v1/search', {
            json: true,
            qs: {
                q: st,
                type: 'track',
                market: 'DE'
            }
        }, function(err, res, body) {
            if (err) {return cb(err)};
            if (!body.tracks || !body.tracks.items || body.tracks.items.length === 0) {
                console.log(body);
                console.log('no track found');
                return cb();
            }
            var item = body.tracks.items[0];
            var spotifyResult = {
                name: item.name,
                artist: item.artists[0].name,
                uri: item.uri
            };
            console.log('track found %j', spotifyResult);
            entry.spotify = spotifyResult;
            fs.writeFileSync('hitparade.json', JSON.stringify(tracks));
            return cb();
        });
    }, function(err) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('done');
    });
}

function addSongs() {
    var tracks = JSON.parse(fs.readFileSync('hitparade.json'));
    var songs = [];
    async.eachLimit(tracks, 1, function(entry, cb) {
        if (!entry.spotify || !entry.spotify.uri) {
            console.log('skipping not found track');
            return cb();
        }
        if (songs.length<100) {
            songs.push(entry.spotify.uri);
            console.log('pushing song to list');
            return cb();
        }
        request(PLAYLIST_URL, {
             json: true,
             method: 'POST',
             auth: {
                bearer: ACCESS_TOKEN
             },
             body: {
                uris: songs
             }
        }, function(err, res, body) {
            console.log('added songs');
            songs = [];
            return cb();
        });
    }, function(err) {
        request(PLAYLIST_URL, {
            json: true,
            method: 'POST',
            auth: {
                bearer: ACCESS_TOKEN
            },
            body: {
                uris: songs
            }
        }, function(err, res, body) {
            console.log(err, 'done');
        });
    });
}
//getAccessToken();
//getToplist();
//findSongs();
//addSongs();
