/*

    listplay.js
    uxpete.com

    // developer.spotify.com/docs/apps/views/1.0/index.html
    // developer.spotify.com/docs/apps/api/1.0/models-playlist.html
    // developer.spotify.com/docs/apps/views/1.0/list-list.html
    // developer.spotify.com/docs/apps/api/1.0/models-collection.html

*/

require(['$views/list#List', '$api/models', '$views/buttons', '$views/utils/css'], 
function(List, models, buttons, css) {


var ui_List1,
    ui_List2,
    dropPosition,
    startIndex,
    startTargetID,
    playlistInPlay,
    uiTimer;

var shiftKey = false, 
    playlistInDrag = false;



var initListPlay = function() { 
     
    var dragenter = false,
        dragClearToExit = true; // this bol prevents multiple dragenter/dragleave firing before dragover has registered, and our pointer events css
    
    // for each playlist_drop_target
    
    // init playlist containers event listeners
    $(".playlist_drop_target").each(function(index) {
        
        var playlist_drop_target = document.querySelector('#playlistContainer'+(index+1));
        
        playlist_drop_target.addEventListener('dragstart', function(e){
            startTargetID = playlist_drop_target;
            e.dataTransfer.setData('text/html', this.innerHTML);
            e.dataTransfer.effectAllowed = 'copy'; // set the desired effects for the source
        }, false);

        playlist_drop_target.addEventListener('dragenter', function(e){
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy'; // set the desired effects for the target
            clearTimeout(uiTimer);
            $('.playlist_drop_target').removeClass('over'); // remove any stuck/lingering classes
            $('table.sp-list-table').removeClass('insertAtListEnd');
            $('tr.sp-list-item').removeClass('drag_over');
            dragClearToExit = false;
           
            if (!dragenter){
                dragenter = true;                
                // if this is a playlist..
                // set up UI flag
                var dragItemType = getURIType( e.dataTransfer.getData('text') );
                if (dragItemType == 'playlist') {
                    playlistInDrag = true;
                } else {
                    playlistInDrag = false;
                }                                
            }
            this.classList.add('over');
            
            // add insertion point at list-end, until we have an index
            if(!playlistInDrag){
                // throttle
                uiTimer = setTimeout(function() {
                    $(playlist_drop_target).find('table.sp-list-table').addClass('insertAtListEnd');
                    clearTimeout(uiTimer);
                }, 100);
            }
            
        }, false);

        playlist_drop_target.addEventListener('dragover', function(e){
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy'; // set the desired effects for the target
            dragClearToExit = true; // throttle
            return false;
        }, false);

        playlist_drop_target.addEventListener('dragleave', function(e){
            e.preventDefault();
            if (dragClearToExit) {
                this.classList.remove('over');
                $('tr.sp-list-item').removeClass('drag_over');
                clearTimeout(uiTimer);
                $('table.sp-list-table').removeClass('insertAtListEnd');
            }
        }, false);

        playlist_drop_target.addEventListener('dragend', function(e){
            e.preventDefault();
            if (dragenter){
                dragenter = false;
                $('tr.sp-list-item').removeClass('drag_over');
            }
            
            this.classList.remove('over');
            this.classList.remove('placeholder-over');
            clearTimeout(uiTimer);
            $('table.sp-list-table').removeClass('insertAtListEnd');
            
        }, false);
        
        playlist_drop_target.addEventListener('drop', function(e){
            e.preventDefault();
            var drop = models.Playlist.fromURI(e.dataTransfer.getData('text'));
            
            if (dragenter){
                dragenter = false;
                $('tr.sp-list-item').removeClass('drag_over');
            }
            
            this.classList.remove('over');
            this.classList.remove('placeholder-over');
            clearTimeout(uiTimer);
            $('table.sp-list-table').removeClass('insertAtListEnd');
            
            // update container
            dropURI(drop.uri, playlist_drop_target);
            
        }, false);
    });
    
    getPrefs(); // first run
};

var getPrefs = function(){

    //debug
    //localStorage.clear();
    
    if (localStorage.ui_List1){
        //saved settings
        //console.log('loading prefs ///////////////////////////////////////////');
        var ui_List1URI = localStorage.ui_List1;
        var ui_List2URI = localStorage.ui_List2;
        
        dropURI(ui_List1URI, document.querySelector('#playlistContainer1'));
        dropURI(ui_List2URI, document.querySelector('#playlistContainer2'));
        
    } else {
        //defaults
        $('#playlistContainer1').addClass('placeholder-over');
        $('#playlistContainer2').addClass('placeholder-over');
    }    
}


// Track drag n drop
function initTrackDrag(targetID) {
    var targetID = '#'+$(targetID).attr('id') || '#playlistContainer1';
    var cols = document.querySelectorAll(targetID+' .sp-list-item');
    
    [].forEach.call(cols, function(col) {
        col.addEventListener('dragstart', trackDragStart, false);
        col.addEventListener('dragenter', trackDragEnter, false);
        col.addEventListener('dragover',  trackDragOver, false);
        col.addEventListener('dragleave', trackDragLeave, false);
        col.addEventListener('dragend',   trackDragEnd, false);
        col.addEventListener('drop',      trackDrop, false);
    });
}

function trackDragStart(e) {
    dropPosition = null; // clear any previous drop position
    
    startIndex = $('.sp-list-wrapper-focus .sp-list-table-body .sp-list-item-selected').prevAll("tr").size();
    startIndex = startIndex + 1;
}
function trackDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); 
    }
    
    // don't do this if 'playlist' being dragged
    if (!playlistInDrag) {
        clearTimeout(uiTimer);
        $('table.sp-list-table').removeClass('insertAtListEnd');
        this.classList.add('drag_over'); 
    }
    /*
    copy: A copy of the source item is made at the new location.
    move: An item is moved to a new location.
    link: A link is established to the source at the new location.
    none: The item may not be dropped.
    */
    e.dataTransfer.dropEffect = 'copy'; 
    return false;
}
function trackDragEnter(e) {    
    if (!playlistInDrag) {
        clearTimeout(uiTimer);
        $('table.sp-list-table').removeClass('insertAtListEnd');
        this.classList.add('drag_over');
    }
}
function trackDragLeave(e) {    
    if (!playlistInDrag) {
        this.classList.remove('drag_over');  // this / e.target is previous target element.
    }
}
function trackDrop(e) {    
    // get tracks position in list    
    var parentContainer = '#'+$(this).parents('.playlist_drop_target').attr('id')+' tr';
    dropPosition = $(this).index(parentContainer);
}
function trackDragEnd(e) {
    //console.log('trackDragEnd');
}



var dropURI = function(draggedURI, targetID) {

    var dropItemType = getURIType(draggedURI);

    // check for playlist, album, track
    switch(dropItemType){
        // drop playlist - add to container and init list //////////////////////////////
        case 'playlist':
            //console.log('dropURI() playlist');
            var playlist = models.Playlist.fromURI(draggedURI);    
            // https://developer.spotify.com/docs/apps/views/1.0/list-list.html
            // new lists
            if ($(targetID).attr('id') == "playlistContainer1"){
                ui_List1 = List.forPlaylist(playlist, {
                    style: 'rounded',
                    height: 'fixed',
                    throbber: 'hide-content',
                    header: 'fixed', /* no */
                    fields: ['image', 'star', 'track', 'artist', 'album', 'time']
                });
                // update playlist container
                targetID.innerHTML = ""; // empty first
                targetID.appendChild(ui_List1.node);
                // init list
                ui_List1.init();
                // save prefs
                localStorage.ui_List1 = draggedURI;                
            } else {
                ui_List2 = List.forPlaylist(playlist, {
                    style: 'rounded',
                    height: 'fixed',
                    throbber: 'hide-content',
                    header: 'fixed', /* no */
                    fields: ['image', 'star', 'track', 'artist', 'album', 'time']
                });
                // update playlist container
                targetID.innerHTML = ""; // empty first
                targetID.appendChild(ui_List2.node);
                // init list
                ui_List2.init();
                // save prefs
                localStorage.ui_List2 = draggedURI;               
            }

            // small delay for list to finish initialising before setting up track dnd
            window.setTimeout(function(){initTrackDrag(targetID)}, 400);
                            
            // update container title
            models.Playlist.fromURI(draggedURI).load('name').done(function(playlist) {
                var title_element = targetID.previousElementSibling;
                $(targetID).attr('data-playlist',draggedURI);
                title_element.textContent = '';
                $(title_element).hide().text(playlist.name.decodeForText()).fadeIn(300);
            });
            
          break;
        // drop track(s) - add to playlist //////////////////////////////
        case 'track':
            //console.log('dropURI() track ///// on '+$(targetID).attr('id')+' ////////////////');
            // grab containers playlist uri
            var containerPlaylist = $(targetID).attr('data-playlist');
            
            // load all tracks in playlist
            models.Playlist.fromURI(containerPlaylist).load('tracks').done(function(playlist) {
                
                var draggedTrackURIs = models.Track.fromURI(draggedURI),                
                    individualTracksURI = draggedTrackURIs.uri.split("\n");

                // DROP AT END OF PLAYLIST (no index)
                if (!dropPosition) { 
                
                    // SINGLE TRACK - AT END OF PLAYLIST
                    if (individualTracksURI.length === 1){
                        playlist.tracks.add(draggedTrackURIs);                        
                        
                        if(!shiftKey){
                        // remove original item
                        removeTracks( startIndex-1, $(startTargetID).attr('id') );
                        }

                  } else {
                    // MULTIPLE TRACKS - AT END OF PLAYLIST
                        var tracksArray = [];
                        var removeMe = [];
                        
                        if (targetID == startTargetID) {
                            // same playlist
                        } else {
                            // different pl
                            targetID = startTargetID; // get our selection from initial pl
                        }
                                                                  
                        if ($(targetID).attr('id') == "playlistContainer1"){
                            var selection = ui_List1.getSelection();
                        } else {
                            var selection = ui_List2.getSelection();
                        }        
                        
                        for (var i = 0; i < individualTracksURI.length; i++) {
                            // tracks to be added
                            tracksArray[i] = models.Track.fromURI(individualTracksURI[i]);
                            // tracks to be (re)moved
                            removeMe[i] = selection.indices[i].item;
                        }
                        
                        playlist.tracks.add(tracksArray);
                        
                        if (!selection.indices[0]) {
                            //console.log('!! multi-track move - but nothing selected ');
                            return false;
                        }
                        
                        // sort in descending position order
                        removeMe = removeMe.sort(function (a,b) {return b-a}); 
                     
                        // multi track remove
                        if(!shiftKey){
                            removeTracks( removeMe, $(startTargetID).attr('id') );
                        }
                    }
                    
                } else { 
                    // we have an index

                    // SINGLE TRACK - INSERT INTO PLAYLIST
                    if (individualTracksURI.length === 1){
                                                
                        // move track higher up the list
                        if ( dropPosition-1 <= startIndex) {
                            
                            // insert track above
                            playlist.tracks.snapshot().done(function(snapshot) {
                                playlist.tracks.insert(snapshot.ref(dropPosition-1), draggedTrackURIs);
                                                                
                                if(!shiftKey){                                
                                    // @todo is this really ok?
                                    window.setTimeout(function(){
                                    
                                        var playlistInDelete = $(startTargetID).attr('id');
                                        
                                        if (playlistInDelete == $(targetID).attr('id')) {
                                        
                                        } else {
                                            startIndex = startIndex-1; // compensate for inserting track above
                                        }
                                    
                                        // remove original track
                                        removeTracks( startIndex, playlistInDelete );
                                    
                                    }, 100); 
                                }                         
                            });
                            
                        } else {                            
                            // insert track below
                            playlist.tracks.snapshot().done(function(snapshot) {
                                playlist.tracks.insert(snapshot.ref(dropPosition-1), draggedTrackURIs);
                            });
                            
                            if(!shiftKey){
                                // @todo is this really ok?
                                window.setTimeout(function(){
                                
                                    var playlistInDelete = $(startTargetID).attr('id');
                                    // remove original track
                                    removeTracks( startIndex-1, playlistInDelete );
                                
                                }, 100);
                            }
                        }                   
                    } else {
                    // INSERT MULTIPLE TRACKS 
                        
                        var tracksArray = []; // get all tracks into array
                        var removeMe = []; // array of tracks to be removed indices
                        var highestTrackInSelection = null;
                        var samePlaylist = false;
                        
                        if (targetID == startTargetID) {samePlaylist = true;}
                        else {samePlaylist = false; targetID = startTargetID;}

                        // which playlist container is this?
                        if ($(targetID).attr('id') == "playlistContainer1"){
                            var selection = ui_List1.getSelection();
                        } else {
                            var selection = ui_List2.getSelection();
                        }  

                        // arrays of tracks to add and remove (indices)
                        for (var i = 0; i < individualTracksURI.length; i++) {
                            tracksArray[i] = models.Track.fromURI(individualTracksURI[i]);
                            removeMe[i] = selection.indices[i].item;
                        }
                        // sort tracks to remove into descending position order
                        removeMe = removeMe.sort(function (a,b) {return b-a});
                                                
                        if (samePlaylist) {
                            // if insert position is above any selected tracks:
                            highestTrackInSelection = removeMe[ (removeMe.length - 1) ];
                        } else {
                            // different pl
                           // get our selection from initial pl
                            highestTrackInSelection = 99999;
                        }

                        // insert tracks
                        
                        // moving tracks higher up the list
                        if ( dropPosition-1 <= highestTrackInSelection) {
                                
                            if ( (dropPosition-1 === highestTrackInSelection) && samePlaylist) { // first track stays in same place (a consolidate-tracks drag)
                                tracksArray.splice(highestTrackInSelection, 1); // remove first track in add
                                removeMe.splice((removeMe.length - 1), 1); // remove last track in removeMe array (first track before sorting)
                                dropPosition = dropPosition +1; // increment drop position as we're not moving first track
                            }

                                                        
                            playlist.tracks.snapshot().done(function(snapshot) {
                                playlist.tracks.insert(snapshot.ref(dropPosition-1), tracksArray);

                                if (samePlaylist && !shiftKey){
                                    for (var j = 0; j < removeMe.length; j++) {
                                        playlist.tracks.remove(snapshot.ref(removeMe[j]));
                                    }                                    
                                }
                            });
                            
                            if (!samePlaylist && !shiftKey){
                                window.setTimeout(function(){
                                    removeTracks( removeMe, $(startTargetID).attr('id') );
                                }, 100);
                            }
                            
                        } else {
                            // moving tracks lower down the list
                            playlist.tracks.snapshot().done(function(snapshot) {
                                playlist.tracks.insert(snapshot.ref(dropPosition-1), tracksArray);
                            });


                            if(!shiftKey){
                                // @todo is this really ok?
                                window.setTimeout(function(){
                                    removeTracks( removeMe, $(startTargetID).attr('id') );                              
                                }, 100);
                            }
                        }                        
                    } 
                }
                // tiny delay before reloading updated playlists
                // seems to be needed to ensure the ui is up to date with event listeners on the newly added tracks
                // @todo is this really ok?
                window.setTimeout(function(){ getPrefs(); }, 10);
            });            
          break;
        case 'album':
          //
          break;
        case 'artist':
          //
          break;
        default:
          // something else
    } // end switch    
}; // dropURI


function removeTracks( trackIndex, containerID ) {

    var containerPlaylist = $('#'+containerID).attr('data-playlist');
    models.Playlist.fromURI(containerPlaylist).load('tracks').done(function(playlist) {        

        if (trackIndex instanceof Array) {
            // multiple tracks
            playlist.tracks.snapshot().done(function(snapshot) {
                for (var j = 0; j < trackIndex.length; j++) {
                    playlist.tracks.remove(snapshot.ref(trackIndex[j])); // remove starting from end of snapshot
                }
            });
        } else {
            // single track
            playlist.tracks.snapshot().done(function(snapshot) {
                playlist.tracks.remove(snapshot.ref(trackIndex));
            });
        }
  
    }); 
}


function updateNowPlaying() {

    // Get the track that is currently playing
    var currentTrack = models.player.track;
     
    // If nothing currently playing
    if (currentTrack == null) {
        //console.log('No track currently playing');
    } else {
        var artist = currentTrack.artists[0].name;
        // manual selection
        var manuallySelectedTrack = $('.sp-list-wrapper-focus tr.sp-list-item-selected'),
            manuallySelectedTrackURI = manuallySelectedTrack.data('uri');
            
        // on track scrub events, playlist looses focus
        playlistInPlay = manuallySelectedTrack.parents('.playlist_drop_target').attr('id') || playlistInPlay;
        
        // check track playing is the track we have selected/focussed in the dom
        if ( (currentTrack == manuallySelectedTrackURI) && !(manuallySelectedTrack.hasClass('first-track-played')) ) {
        
            $('tr.sp-list-item').removeClass('sp-list-item-playing last-track-played');
            manuallySelectedTrack.addClass('sp-list-item-playing last-track-played');
        } else {
            // track playing is not the ui-selected track
            // is it the next track in list?
            var lastTrackPlayed = $('#'+playlistInPlay).find('.last-track-played'),
                nextTrack = lastTrackPlayed.next('tr'),
                nextTrackURI = nextTrack.data('uri'),
                prevTrack = lastTrackPlayed.prev('tr'),
                prevTrackURI = prevTrack.data('uri'),
                trackPlaying = $('#'+playlistInPlay).find('.sp-list-item-playing'),
                trackPlayingURI = trackPlaying.data('uri');               
             
            // see if the next track in line is playing    
            if (currentTrack == nextTrackURI) {
                $('tr.sp-list-item').removeClass('sp-list-item-playing last-track-played');
                nextTrack.addClass('sp-list-item-playing last-track-played');
            
            // see if original track is still playing                      
            } else if (currentTrack == trackPlayingURI) {
                // do nothing, must have been a scrub event
            
            // see if the prev track is playing
            } else if (currentTrack == prevTrackURI) {
                $('tr.sp-list-item').removeClass('sp-list-item-playing last-track-played');
                prevTrack.addClass('sp-list-item-playing last-track-played');
            }
        }
    }
}
function trackDoubleClickHelper() {
    $('tr.sp-list-item').removeClass('first-track-played');
    $('.sp-list-wrapper-focus tr.sp-list-item-selected').addClass('first-track-played');
}


/* !event listeners */
models.player.addEventListener('change', updateNowPlaying);
models.application.addEventListener('activate', updateNowPlaying); // fires when switching back to app, and initial loading

$('.playlist_drop_target').on('dblclick', trackDoubleClickHelper);

document.addEventListener('keyup', function(e){
    shiftKey = e.shiftKey;
    //console.log('keyup() shiftKey='+shiftKey);
});

// keydown listener
document.addEventListener('keydown', function (e) {
    //console.log(e.keyCode);
    
    shiftKey = e.shiftKey;
    //console.log('keydown() shiftKey='+shiftKey);
        
    // backspace || delete
    if( e.keyCode == 8 || e.keyCode == 46 ) {
        // get currently focussed playlist
        var currentPlaylistContainer = $(document.activeElement).parent();
        var currentPlaylistContainerID = $(currentPlaylistContainer).attr('id');
        var currentPlaylistContainerURI = $(currentPlaylistContainer).attr('data-playlist');
        var playlist = models.Playlist.fromURI(currentPlaylistContainerURI);  

        if (currentPlaylistContainerID == "playlistContainer1"){
            var selection = ui_List1.getSelection();
        } else {
            var selection = ui_List2.getSelection();
        }        

        if (!selection.indices[0]) {
            //console.log('nothing selected ');
            return false;
        }

        selection.indices;
        //console.log('selection.indices ..'); console.log(selection.indices); console.log('slot: '+selection.indices[0].item);
        selection.uris; 

        // load all tracks in playlist
        models.Playlist.fromURI(currentPlaylistContainerURI).load('tracks').done(function(playlist) {
            
                var selectedTrackURIs = models.Track.fromURI(selection.uris);                
                var individualTracksURI = selectedTrackURIs.uri;
                // single track
                if( typeof individualTracksURI === 'string' ) {
                    playlist.tracks.snapshot().done(function(snapshot) {
                        playlist.tracks.remove(snapshot.ref(selection.indices[0].item));
                    });
                } else {
                // multiple tracks
                    var removeMe = [];
                    for (var i = 0; i < individualTracksURI.length; i++) {                        
                        // add each track to be removed into array
                        removeMe[i] = selection.indices[i].item;
                    }
                    //console.log('positions: '+removeMe);
                    // sort in descending position order
                    removeMe = removeMe.sort(function (a,b) {return b-a});
                    
                    // remove starting from end of snapshot
                    playlist.tracks.snapshot().done(function(snapshot) {
                        for (var j = 0; j < removeMe.length; j++) {
                            playlist.tracks.remove(snapshot.ref(removeMe[j]));
                        }
                    });                    
                }
        });
    }     
}, false); // keydown


function getURIType(URItoParse) {

    var parser = document.createElement('a');
    parser.href = URItoParse;
    if (parser.pathname.indexOf("playlist") !== -1) {
      return "playlist";
    } else if (parser.pathname.indexOf("album") !== -1) {
      return "album";
    } else if (parser.pathname.indexOf("artist") !== -1) {
      return "artist";
    } else if (parser.pathname.indexOf("track") !== -1) {
      return "track";
    } else {
      return "undefined";
    }
    /*
    console.log(
        'parser.protocol: '+parser.protocol+'\n'+
        'parser.hostname: '+parser.hostname+'\n'+
        'parser.port: '+parser.port+'\n'+
        'parser.pathname: '+parser.pathname+'\n'+
        'parser.search: '+parser.search+'\n'+
        'parser.hash: '+parser.hash+'\n'+
        'parser.host: '+parser.host
    );
    */
}

    exports.initListPlay = initListPlay;
});
