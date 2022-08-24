## diff_cloudfront_snapshot

- HTTP方法: `POST`

- 请求
```json
/snapshot/diff_cloudfront_snapshot?distribution_id=E20GR9AX7K798K&snapshot1=FirstSnapshot&snapshot2=SecondSnapshot
```

- 请求参数
    - distribution_id: String
    - snapshot1: String
    - snapshot2: String


- 响应
```json
"diff --git a/tmp/E20GR9AX7K798K_3.json b/tmp/E20GR9AX7K798K_6.json\nindex 4bded46..cb7824e 100644\n--- a/tmp/E20GR9AX7K798K_3.json\n+++ b/tmp/E20GR9AX7K798K_6.json\n@@ -99,7 +99,7 @@\n     \"CustomErrorResponses\": {\n         \"Quantity\": 0\n     },\n-    \"Comment\": \"my test for cf\",\n+    \"Comment\": \"my test for cf a new one\",\n     \"Logging\": {\n         \"Enabled\": false,\n         \"IncludeCookies\": false,\n"
```
