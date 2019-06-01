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
      var trackGroup = [];
      var albumArtGroup = [];
    }

    albumArtGroup.push(albumArt);
    trackTitlesGroup.push(track)
  }

  var row = {"covers": albumArtGroup, "tracks": trackTitlesGroup};
  data.push(row);

  return data
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
    scopes: 'user-top-read',
    redirect_uri: 'https://spotitude.netlify.com',
    // redirect_uri: 'http://localhost:8000',
    type: 'tracks',
    time_range: 'short_term',
    limit: '25',
    data: null
  },
  methods: {
    login: function() {
      let popup = window.open(`https://accounts.spotify.com/authorize?client_id=${this.client_id}&response_type=token&redirect_uri=${this.redirect_uri}&scope=${this.scopes}&show_dialog=true`, 'Login with Spotify', 'width=800,height=600')

      window.spotifyCallback = (payload) => {
        popup.close()

        var uri = `https://api.spotify.com/v1/me/top/tracks?time_range=${this.time_range}&limit=${this.limit}`;

        fetch(uri, {
          headers: {
            'Authorization': `Bearer ${payload}`
          }
        }).then(response => {
          return response.json()
        }).then(data => {
          this.data = parseData(data)
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
