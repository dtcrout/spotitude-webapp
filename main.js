function parseData(obj) {
  // Get album art and track titles and store in JSON
  var data = [];
  var albumArtGroup = [];
  var trackTitlesGroup = [];

  for (i = 0; i < 25; i++) {
    // Get album art and track titles from JSON
    var albumArt = obj['items'][i]['album']['images'][1]['url'];
    var artist = obj['items'][i]['album']['artists'][0]['name'];
    var title = obj['items'][i]['name'];
    var track = artist + ' - ' + title;

    if (i % 5 === 0 && i !== 0) {
      var row = {"covers": albumArtGroup, "tracks": trackTitlesGroup};
      data.push(row);
      var trackTitlesGroup = [];
      var albumArtGroup = [];
    }

    albumArtGroup.push(albumArt);
    trackTitlesGroup.push(track)
  }

  var row = {"covers": albumArtGroup, "tracks": trackTitlesGroup};
  data.push(row);

  return data
}

function getTrackIds(obj) {
  // Get track IDs for top tracks
  var trackList = [];

  for (i = 0; i < 25; i++) {
    var trackId = obj['items'][i]['id'];
    trackList.push('spotify:track:' + trackId)
  }

  return trackList
}

Vue.component('row', {
  // Row entry for table
  props: ['covers', 'tracks'],
  template:
    '<tr>' +
    '<td><img :src=covers[0] style="height:40%;"></td>' +
    '<td><img :src=covers[1] style="height:40%;"></td>' +
    '<td><img :src=covers[2] style="height:40%;"></td>' +
    '<td><img :src=covers[3] style="height:40%;"></td>' +
    '<td><img :src=covers[4] style="height:40%;"></td>' +
    '<td valign="top" align="left"><p>{{tracks[0]}}<br>{{tracks[1]}}<br>{{tracks[2]}}<br>{{tracks[3]}}<br>{{tracks[4]}}<br></p></td>' +
    '</tr>'
})

var app = new Vue({
  el: '#app',
  data: {
    client_id: 'c931a0d9f79848a3813338b5598a2369',
    scopes: [
      'user-top-read',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-private',
      'user-read-email',
      'user-read-birthdate'
    ],
    // redirect_uri: 'https://spotitude.me',
    redirect_uri: 'http://localhost:8000',
    type: 'tracks',
    time_ranges: ['short_term', 'medium_term', 'long_term'],
    limit: '25',
    display: null,
    tracks: null,
    state: null,
    shortTermData: null,
    mediumTermData: null,
    longTermData: null,
    shortTermTracks: null,
    mediumTermTracks: null,
    longTermTracks: null
  },
  methods: {
    login: function() {
      let popup = window.open(`https://accounts.spotify.com/authorize?client_id=${this.client_id}&response_type=token&redirect_uri=${this.redirect_uri}&scope=${this.scopes[0]}&show_dialog=true`, 'Login with Spotify')

      window.spotifyCallback = (payload) => {
        popup.close()

        // Get short term top tracks
        fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${this.time_ranges[0]}&limit=${this.limit}`, {
          headers: {
            'Authorization': `Bearer ${payload}`
          }
        }).then(response => {
          return response.json()
        }).then(data => {
          this.shortTermData = parseData(data)
          this.display = this.shortTermData

          this.shortTermTracks = getTrackIds(data)
          this.tracks = this.shortTermTracks
          this.state = 'last 4 weeks'
        })

        // Get medium term top tracks
        fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${this.time_ranges[1]}&limit=${this.limit}`, {
          headers: {
            'Authorization': `Bearer ${payload}`
          }
        }).then(response => {
          return response.json()
        }).then(data => {
          this.mediumTermData = parseData(data)
          this.mediumTermTracks = getTrackIds(data)
        })

        // Get long term top tracks
        fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${this.time_ranges[2]}&limit=${this.limit}`, {
          headers: {
            'Authorization': `Bearer ${payload}`
          }
        }).then(response => {
          return response.json()
        }).then(data => {
          this.longTermData = parseData(data)
          this.longTermTracks = getTrackIds(data)
        })
      }
    },
    shortTerm: function() {
      // Set display, tracks and state to short term
      this.display = this.shortTermData
      this.tracks = this.shortTermTracks
      this.state = 'last 4 weeks'
    },
    mediumTerm: function() {
      // Set display, tracks and state to medium term
      this.display = this.mediumTermData
      this.tracks = this.mediumTermTracks
      this.state = 'last 6 months'
    },
    longTerm: function() {
      // Set display, tracks and state to long term
      this.display = this.longTermData
      this.tracks = this.longTermTracks
      this.state = 'all time'
    },
    makePlaylist: function() {
      /*
        Function to make playlist. List of actions to make a playlist:
        - Get user id
        - With user id, create a new playlist
        - Get playlist id and add tracks to playlist
      */
      let popup = window.open(`https://accounts.spotify.com/authorize?client_id=${this.client_id}&response_type=token&redirect_uri=${this.redirect_uri}&scope=${this.scopes[1]},${this.scopes[2]},${this.scopes[3]},${this.scopes[4]},${this.scopes[5]}&show_dialog=true`, 'Login with Spotify')

      window.spotifyCallback = (payload) => {
        popup.close()

        var createPlaylistBody = {
          "name": "spotitude " + this.state,
          "description": "Top 25 tracks for " + this.state + ". Generated my spotitude.me",
          "public": true
        }

        fetch(`https://api.spotify.com/v1/me`, {
          headers: {
            'Authorization': `Bearer ${payload}`
          }
        }).then(response => {
          return response.json()
        }).then(data => {
          return data['id']
        }).then(userId => {
          fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: 'POST',
            body: JSON.stringify(createPlaylistBody),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${payload}`
            },
            json: true
          }).then(response => {
            return response.json();
          }).then(data => {
            return data['id']
          }).then(playlistId => {
            fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
              method: 'POST',
              body: JSON.stringify({"uris": this.tracks}),
              headers:{
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${payload}`
              },
              'json': true
            })
            return playlistId
          }).then(playlistId => {
              let playlistPopup = window.open(`https://open.spotify.com/playlist/${playlistId}`);
          })
        })
      }
    }
  },
  mounted: function() {
    this.token = window.location.hash.substr(1).split('&')[0].split("=")[1]

    if (this.token) {
      window.opener.spotifyCallback(this.token)
    }
  }
})
