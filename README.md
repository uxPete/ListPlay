ListPlay
========

Spotify playlist curation app

I wanted a way to have two playlists on the screen at a time and move tracks between them, so I built this little app.

![Screenshot taken Oct 23 2013](http://peteharris.co.uk/img/listplay_screenshot.png)

![Screenshot taken Oct 23 2013](http://peteharris.co.uk/img/listplay-draging-tracks-screenshot.png)

Installing
----------
* To get started you need to have your [Spotify account enabled](https://developer.spotify.com/technologies/apps/#developer-account) as a ‘developer’.
* If you don't already have one create the Spotify folder:
* ~/Spotify (Mac OS X and Linux)
* “My Documents\Spotify” (Windows)
* Download ZIP, expand, rename bundle as 'xlistplay',  move to Spotify folder
* Open Spotify app, type 'spotify:app:xlistplay' in the search bar
* Save ListPlay app as a favourite (the 'x' in front of 'listplay' makes it display at the bottom of the apps list. You can change this - just make sure the bundle name and the 'BundleIdentifier' string in the manifest file both match.)

Using
-----
* Drag n drop a playlist onto each container
* Drag tracks within a playlist, or from one playlist to another
* Drag multiple tracks by cmd-selecting them
* The Delete key removes the selected tracks
* Dragging tracks with the Shift key down will copy the tracks rather than move them
* Double-click to play a track etc


Update / Possible improvements
-----------------------------------
* A spotify update in Oct 2013 has broken some of the functionality, first thing that needs doing is figuring out what they changed and patching the app. (Unfortunately this is a result of reverse engineering Spotify and doing unspported things with their API).
* add nowplaying icon when current track came from queue or random, and is in view
* edit in place - for playlist titles

