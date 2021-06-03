import json
 
CONTENT = """
 <\!DOCTYPE html>
 <html lang="en">
   <head>
     <meta charset="utf-8">
     <title>Simple Lambda@Edge Static Content Response</title>
   </head>
   <body>
     <p>Hello from Lambda@Edge!</p>
   </body>
 </html>
 """
 
def lambda_handler(event, context):
     # Generate HTTP OK response using 200 status code with HTML body.
     response = {
         'status': '200',
         'statusDescription': 'OK',
         'headers': {
             'cache-control': [
                 {
                     'key': 'Cache-Control',
                     'value': 'max-age=100'
                 }
             ],
             "content-type": [
                 {
                     'key': 'Content-Type',
                     'value': 'text/html'
                 }
             ]
         },
         'body': CONTENT,
         'message': 'testing_6'
     }
     return response
