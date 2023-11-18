import { app }  from './app';
import path from "path";
import * as dotenv from 'dotenv';

dotenv.config();

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log('Node NOT Exiting...');
});

process.on('unhandledRejection', function (err) {
  console.error(err);
  console.log('Node NOT Exiting...');
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  // eslint-disable no-console
  console.log(`Listening: http://localhost:${port}`);

});

// Configure Express to use EJS
app.set( "views", path.join( __dirname, "views" ) );
app.set( "view engine", "ejs" );