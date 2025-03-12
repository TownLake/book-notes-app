Using the cloudflare agents-sdk, create a cloudflare worker that receives a link of an amazon page like https://www.amazon.com/Hunt-October-Jack-Ryan-Novel-ebook/dp/B001PSEPLG/ and gather:
* ASIN
* year published
* page length
* description
* properly cased title and author

add error logging. give me a sample curl to use. generate the index.ts and wrangler.jsonc. do not attempt to save previous searches. always perform from scratch. always use the agents-sdk.

migrations in wrangler.jsonc should just be new_sqlite_classes not that and new_classes
The browser field should be an object, not an array with a binding object.