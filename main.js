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
    redirect_uri: 'https://spotitude.me',
//     redirect_uri: 'http://localhost:8000',
    type: 'tracks',
    time_ranges: ['short_term', 'medium_term', 'long_term'],
    limit: '25',
    display: null,
    short_term_data: null,
    medium_term_data: null,
    long_term_data: null
  },
  methods: {
    login: function() {
      let popup = window.open(`https://accounts.spotify.com/authorize?client_id=${this.client_id}&response_type=token&redirect_uri=${this.redirect_uri}&scope=${this.scopes}&show_dialog=true`, 'Login with Spotify')

      window.spotifyCallback = (payload) => {
        popup.close()

        var short_uri = `https://api.spotify.com/v1/me/top/tracks?time_range=${this.time_ranges[0]}&limit=${this.limit}`;
        var medium_uri = `https://api.spotify.com/v1/me/top/tracks?time_range=${this.time_ranges[1]}&limit=${this.limit}`;
        var long_uri = `https://api.spotify.com/v1/me/top/tracks?time_range=${this.time_ranges[2]}&limit=${this.limit}`;

        fetch(short_uri, {
          headers: {
            'Authorization': `Bearer ${payload}`
          }
        }).then(response => {
          return response.json()
        }).then(data => {
          this.short_term_data = parseData(data)
          this.display = this.short_term_data
        })

        fetch(medium_uri, {
          headers: {
            'Authorization': `Bearer ${payload}`
          }
        }).then(response => {
          return response.json()
        }).then(data => {
          this.medium_term_data = parseData(data)
        })

        fetch(long_uri, {
          headers: {
            'Authorization': `Bearer ${payload}`
          }
        }).then(response => {
          return response.json()
        }).then(data => {
          this.long_term_data = parseData(data)
        })
      }
    },
    short_term: function() {
      this.display = this.short_term_data
    },
    medium_term: function() {
      this.display = this.medium_term_data
    },
    long_term: function() {
      this.display = this.long_term_data
    },
  },
  mounted: function() {
    this.token = window.location.hash.substr(1).split('&')[0].split("=")[1]

    if (this.token) {
      window.opener.spotifyCallback(this.token)
    }
  }
})
