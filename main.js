function getAlbumArt(obj) {
  // Get album art paths from JSON and store in array
  var albumArtArr = [];
  var albumArtGroup = [];

  for (i = 0; i < 25; i++) {
    var albumArt = obj['items'][i]['album']['images'][1]['url'];

    if (i % 5 === 0 && i !== 0) {
      albumArtArr.push(albumArtGroup)
      var albumArtGroup = [];
    }

    albumArtGroup.push(albumArt);
  }

  albumArtArr.push(albumArtGroup)

  return albumArtArr
}

function getTrackTitles(obj) {
  // Get track titles from JSON and store in subarrays of size 5
  var trackArr = [];
  var trackGroup = [];

  for (i = 0; i < 25; i++) {
    var artist = obj['items'][i]['album']['artists'][0]['name'];
    var title = obj['items'][i]['name'];
    var track = artist + ' - ' + title;

    if (i % 5 === 0 && i !== 0) {
      trackArr.push(trackGroup)
      var trackGroup = [];
    }

    trackGroup.push(track)
  }

  trackArr.push(trackGroup)

  return trackArr;
}

function makeData(covers, tracks) {
  var dataList = [];

  for (i = 0; i < 5; i++) {
    var data = new Object();
    data.covers = covers[i];
    data.tracks = tracks[i];
    dataList.push(data);
  }

  return dataList
}

Vue.component('row', {
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
    scopes: 'user-top-read',
    redirect_uri: 'https://xenodochial-noyce-946268.netlify.com',
    type: 'tracks',
    time_range: 'short_term',
    limit: '25',
    uri: 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=25',
    albumArt: null,
    trackTitles: null,
    visData: null
  },
  methods: {
    login: function() {
      let popup = window.open(`https://accounts.spotify.com/authorize?client_id=${this.client_id}&response_type=token&redirect_uri=${this.redirect_uri}&scope=${this.scopes}&show_dialog=true`, 'Login with Spotify', 'width=800,height=600')

      window.spotifyCallback = (payload) => {
        popup.close()

        fetch(this.uri, {
          headers: {
            'Authorization': `Bearer ${payload}`
          }
        }).then(response => {
          return response.json()
        }).then(data => {
          this.albumArt = getAlbumArt(data)
          this.trackTitles = getTrackTitles(data)
          this.visData = makeData(this.albumArt, this.trackTitles)
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
