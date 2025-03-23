## What is this?

A simple web app that takes a book title and searches for the book's metadata.

I keep a [running log](https://blog.samrhea.com/category/reading/) of the books I read, complete with details about the book like page length and ASIN/ISBN. This automates all of that! You input a book title and it searches for that metadata and generates the .md file ready to paste into your repo or wherever you keep your own book logs.

## How can I test and deploy it?

### .env.local

You'll need to set these local variables to tinker around with it before deploying it. These are the Cloudflare Access service token details so that you can make sure that the endpoints are only accessible to your application.

VITE_CF_ACCESS_CLIENT_ID=NUMBER
VITE_CF_ACCESS_CLIENT_SECRET=NUMBER

They should then be set in your Cloudflare Pages app to deploy to production.

### Commands

npm run deploy:prod
