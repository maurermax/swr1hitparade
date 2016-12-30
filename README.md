# SWR1 Top 1000 fetcher

This is a very basic repo for fetching the SWR1 Top 1000 list of 2016 and converting it where possible into a Spotify Playlist.

## How to?
As always start with running `npm install`

A bit of manual overhead is required. 
  
  * Create an o auth token
  * use `getAccessToken()` to convert the o auth token into an access token
  * use `getToplist()` to retrieve and store the current top list
  * use `findSongs()` to add spotify track information to the downloaded songs
  * use `addSongs()` to add the spotify tracks to a spotify account and a playlist there
  
You will need to fill in certain variables in the top with Spotify Developer account information.
