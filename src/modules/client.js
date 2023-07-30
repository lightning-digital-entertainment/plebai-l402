const {Lsat} = require('./l402js')

// Sample client code to run and test if L402 is working
async function run() {

    //get the value from WWW_authenticate API
    const header = 'L402 token="AgELcGxlYmFpLWw0MDIChAEwMDAwN2RmMzAwYzA5MTZiYjliYzQ3MjAyZWRlZGQ4NjFjMTllNjU2ZmFiM2YwNzYwMjc3ZjNlZjU3ZGQ0ZjcwY2ZlNDkyNzk0YmUwYWQ0ODUwOThiNGM4NTM0ZDNmYmYwYzQ5MTAyNWViNjRiN2Y5NDJkYTIwZWQ5OGRjZjYyZGFhYTgAAklib2R5SGFzaD02ZTNjYTBhMDQ3NzM0NjYxYzM0MzE1ZGYyMGE2MzgyMjhjMjBjYmJkODRlMWJmZWU1NjQxMmFhOWViNjA3ZWQ0AAIYZXhwaXJhdGlvbj0xNjkwMzgwNTEyMDgzAAAGIN+/PqUTYA+0j7wdJyYvliUsvkx4Y61E6RMnh2cXwEJE", invoice="lnbc1u1pjvzf2mpp50hespsy3dwumc3eq9m0dmpsur8n9d74n7pmqyalnaata6nmseljqhp5ywzxcktp43fg6nmawyeduzltzv4t0lld0ju33fm6zg86f4dnkvjqcqzpgxqyz5vqrzjqd0ylaqclj9424x9m8h2vcukcgnm6s56xfgu3j78zyqzhgs4hlpzvzlthsqqf0gqqyqqqqqqqqqqqqqqqqrzjqvjpj9slq5z6j4wyqf0fp66yraw0tvgr4xde7tx799jlhq8xk2wcczumkcqqfacqqyqqqqqqqqqqqqqqqqsp5a2a644rrdzsa7wy5atdk377udtqwv4n7e4w9callfn3xsyfcjlxq9qyyssqh9e7drqzdjt7xfx4u0r975hknu3nnkcywgrytfj72gtppgxfh9qke9pc3zwxlp9f8f3qmp5hpg5fp7efym80h2nnlljxh0mrkdmx9dgps6faqd"'
    const lsat = Lsat.fromHeader(header)

    //Set the preimage corrosponding to invoice
    const preimage = '05d5344b689e99b5371bd1d1afc60c9807dd2175e90346e23b781eb60723e66c'
  
    lsat.setPreimage(preimage)
  
    console.log(lsat.toJSON());
    console.log(lsat.toToken());
  
  
  }
  run();
