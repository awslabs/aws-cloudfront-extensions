import datetime
from typing import TypedDict, Any, List
from layer.common.types_ import ResponseMetadata


# A list of CloudFront key pair identifiers.
class KeyPairIds(TypedDict):
    # The number of key pair identifiers in the list.
    #
    # This member is required.
    Quantity: int

    # A list of CloudFront key pair identifiers.
    Items: List[str]


# A list of identifiers for the public keys that CloudFront can use to verify the
# signatures of signed URLs and signed cookies.
class KGKeyPairIds(TypedDict):
    # The identifier of the key group that contains the public keys.
    KeyGroupId: str

    # A list of CloudFront key pair identifiers. \
    KeyPairIds: KeyPairIds


# A list of Amazon Web Services accounts and the active CloudFront key pairs in
# each account that CloudFront can use to verify the signatures of signed URLs and
# signed cookies.
class Signer(TypedDict):
    # An Amazon Web Services account number that contains active CloudFront key pairs
    # that CloudFront can use to verify the signatures of signed URLs and signed
    # cookies. If the Amazon Web Services account that owns the key pairs is the same
    # account that owns the CloudFront distribution, the value of this field is self.
    AwsAccountNumber: str

    # A list of CloudFront key pair identifiers. \
    KeyPairIds: KeyPairIds


# A list of key groups, and the public keys in each key group, that CloudFront can
# use to verify the signatures of signed URLs and signed cookies.
class ActiveTrustedKeyGroups(TypedDict):
    # This field is true if any of the key groups have public keys that CloudFront can
    # use to verify the signatures of signed URLs and signed cookies. If not, this
    # field is false.
    #
    # This member is required.
    Enabled: bool

    # The number of key groups in the list.
    #
    # This member is required.
    Quantity: int

    # A list of key groups, including the identifiers of the public keys in each key
    # group that CloudFront can use to verify the signatures of signed URLs and signed
    # cookies.
    Items: List[KGKeyPairIds]


# A list of Amazon Web Services accounts and the active CloudFront key pairs in
# each account that CloudFront can use to verify the signatures of signed URLs and
# signed cookies.
class ActiveTrustedSigners(TypedDict):
    # This field is true if any of the Amazon Web Services accounts in the list have
    # active CloudFront key pairs that CloudFront can use to verify the signatures of
    # signed URLs and signed cookies. If not, this field is false.
    #
    # This member is required.
    Enabled: bool

    # The number of Amazon Web Services accounts in the list.
    #
    # This member is required.
    Quantity: int

    # A list of Amazon Web Services accounts and the identifiers of active CloudFront
    # key pairs in each account that CloudFront can use to verify the signatures of
    # signed URLs and signed cookies.
    Items: List[Signer]


# A complex type that controls the countries in which your content is distributed.
# CloudFront determines the location of your users using MaxMind GeoIP databases.
class GeoRestriction(TypedDict):
    # When geo restriction is enabled, this is the number of countries in your
    # whitelist or blacklist. Otherwise, when it is not enabled, Quantity is 0, and
    # you can omit Items.
    #
    # This member is required.
    Quantity: int

    # The method that you want to use to restrict distribution of your content by
    # country:
    #
    # * none: No geo restriction is enabled, meaning access to content is
    # not restricted by client geo location.
    #
    # * blacklist: The Location elements
    # specify the countries in which you don't want CloudFront to distribute your
    # content.
    #
    # * whitelist: The Location elements specify the countries in which you
    # want CloudFront to distribute your content.
    #
    # This member is required.
    RestrictionType: str

    # A complex type that contains a Location element for each country in which you
    # want CloudFront either to distribute your content (whitelist) or not distribute
    # your content (blacklist). The Location element is a two-letter, uppercase
    # country code for a country that you want to include in your blacklist or
    # whitelist. Include one Location element for each country. CloudFront and MaxMind
    # both use ISO 3166 country codes. For the current list of countries and the
    # corresponding codes, see ISO 3166-1-alpha-2 code on the International
    # Organization for Standardization website. You can also refer to the country list
    # on the CloudFront console, which includes both country names and codes.
    Items: List[str]


# A complex type that identifies ways in which you want to restrict distribution
# of your content.
class Restrictions(TypedDict):
    # A complex type that controls the countries in which your content is distributed.
    # CloudFront determines the location of your users using MaxMind GeoIP databases.
    #
    # This member is required.
    GeoRestriction: GeoRestriction


# A complex type that controls whether CloudFront caches the response to requests
# using the specified HTTP methods. There are two choices:
#
# * CloudFront caches
# responses to GET and HEAD requests.
#
# * CloudFront caches responses to GET, HEAD,
# and OPTIONS requests.
#
# If you pick the second choice for your Amazon S3 Origin,
# you may need to forward Access-Control-Request-Method,
# Access-Control-Request-Headers, and Origin headers for the responses to be
# cached correctly.
class CachedMethods(TypedDict):
    # A complex type that contains the HTTP methods that you want CloudFront to cache
    # responses to.
    #
    # This member is required.
    Items: List[str]

    # The number of HTTP methods for which you want CloudFront to cache responses.
    # Valid values are 2 (for caching responses to GET and HEAD requests) and 3 (for
    # caching responses to GET, HEAD, and OPTIONS requests).
    #
    # This member is required.
    Quantity: int


# A complex type that controls which HTTP methods CloudFront processes and
# forwards to your Amazon S3 bucket or your custom origin. There are three
# choices:
#
# * CloudFront forwards only GET and HEAD requests.
#
# * CloudFront
# forwards only GET, HEAD, and OPTIONS requests.
#
# * CloudFront forwards GET, HEAD,
# OPTIONS, PUT, PATCH, POST, and DELETE requests.
#
# If you pick the third choice,
# you may need to restrict access to your Amazon S3 bucket or to your custom
# origin so users can't perform operations that you don't want them to. For
# example, you might not want users to have permissions to delete objects from
# your origin.
class AllowedMethods(TypedDict):
    # A complex type that contains the HTTP methods that you want CloudFront to
    # process and forward to your origin.
    #
    # This member is required.
    Items: List[str]

    # The number of HTTP methods that you want CloudFront to forward to your origin.
    # Valid values are 2 (for GET and HEAD requests), 3 (for GET, HEAD, and OPTIONS
    # requests) and 7 (for GET, HEAD, OPTIONS, PUT, PATCH, POST, and DELETE requests).
    #
    # This member is required.
    Quantity: int

    # A complex type that controls whether CloudFront caches the response to requests
    # using the specified HTTP methods. There are two choices:
    #
    # * CloudFront caches
    # responses to GET and HEAD requests.
    #
    # * CloudFront caches responses to GET, HEAD,
    # and OPTIONS requests.
    #
    # If you pick the second choice for your Amazon S3 Origin,
    # you may need to forward Access-Control-Request-Method,
    # Access-Control-Request-Headers, and Origin headers for the responses to be
    # cached correctly.
    CachedMethods: CachedMethods


# A CloudFront function that is associated with a cache behavior in a CloudFront
# distribution.
class FunctionAssociation(TypedDict):
    # The event type of the function, either viewer-request or viewer-response. You
    # cannot use origin-facing event types (origin-request and origin-response) with a
    # CloudFront function.
    #
    # This member is required.
    EventType: str

    # The Amazon Resource Name (ARN) of the function.
    #
    # This member is required.
    FunctionARN: str


# A list of CloudFront functions that are associated with a cache behavior in a
# CloudFront distribution. CloudFront functions must be published to the LIVE
# stage to associate them with a cache behavior.
class FunctionAssociations(TypedDict):
    # The number of CloudFront functions in the list.
    #
    # This member is required.
    Quantity: int

    # The CloudFront functions that are associated with a cache behavior in a
    # CloudFront distribution. CloudFront functions must be published to the LIVE
    # stage to associate them with a cache behavior.
    Items: List[FunctionAssociation]


# A complex type that contains a Lambda@Edge function association.
class LambdaFunctionAssociation(TypedDict):
    # Specifies the event type that triggers a Lambda@Edge function invocation. You
    # can specify the following values:
    #
    # * viewer-request: The function executes when
    # CloudFront receives a request from a viewer and before it checks to see whether
    # the requested object is in the edge cache.
    #
    # * origin-request: The function
    # executes only when CloudFront sends a request to your origin. When the requested
    # object is in the edge cache, the function doesn't execute.
    #
    # * origin-response:
    # The function executes after CloudFront receives a response from the origin and
    # before it caches the object in the response. When the requested object is in the
    # edge cache, the function doesn't execute.
    #
    # * viewer-response: The function
    # executes before CloudFront returns the requested object to the viewer. The
    # function executes regardless of whether the object was already in the edge
    # cache. If the origin returns an HTTP status code other than HTTP 200 (OK), the
    # function doesn't execute.
    #
    # This member is required.
    EventType: str

    # The ARN of the Lambda@Edge function. You must specify the ARN of a function \
    # version; you can't specify an alias or $LATEST.
    #
    # This member is required.
    LambdaFunctionARN: str

    # A flag that allows a Lambda@Edge function to have read access to the body
    # content. For more information, see Accessing the Request Body by Choosing the
    # Include Body Option
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-include-body-access.html)
    # in the Amazon CloudFront Developer Guide. \
    IncludeBody: bool


# A complex type that specifies a list of Lambda@Edge functions associations for a
# cache behavior. If you want to invoke one or more Lambda@Edge functions
# triggered by requests that match the PathPattern of the cache behavior, specify
# the applicable values for Quantity and Items. Note that there can be up to 4
# LambdaFunctionAssociation items in this list (one for each possible value of
# EventType) and each EventType can be associated with only one function. If you
# don't want to invoke any Lambda@Edge functions for the requests that match
# PathPattern, specify 0 for Quantity and omit Items.
class LambdaFunctionAssociations(TypedDict):
    # The number of Lambda@Edge function associations for this cache behavior.
    #
    # This member is required.
    Quantity: int

    # Optional: A complex type that contains LambdaFunctionAssociation items for this
    # cache behavior. If Quantity is 0, you can omit Items.
    Items: List[LambdaFunctionAssociation]


# A list of key groups whose public keys CloudFront can use to verify the
# signatures of signed URLs and signed cookies.
class TrustedKeyGroups(TypedDict):
    # This field is true if any of the key groups in the list have public keys that
    # CloudFront can use to verify the signatures of signed URLs and signed cookies.
    # If not, this field is false.
    #
    # This member is required.
    Enabled: bool

    # The number of key groups in the list.
    #
    # This member is required.
    Quantity: int

    # A list of key groups identifiers.
    Items: List[str]


# A list of Amazon Web Services accounts whose public keys CloudFront can use to
# verify the signatures of signed URLs and signed cookies.
class TrustedSigners(TypedDict):
    # This field is true if any of the Amazon Web Services accounts have public keys
    # that CloudFront can use to verify the signatures of signed URLs and signed
    # cookies. If not, this field is false.
    #
    # This member is required.
    Enabled: bool

    # The number of Amazon Web Services accounts in the list.
    #
    # This member is required.
    Quantity: int

    # A list of Amazon Web Services account identifiers.
    Items: List[str]


# A complex type that contains HeaderName and HeaderValue elements, if any, for
# this distribution.
class OriginCustomHeader(TypedDict):
    # The name of a header that you want CloudFront to send to your origin. For more
    # information, see Adding Custom Headers to Origin Requests
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/forward-custom-headers.html)
    # in the Amazon CloudFront Developer Guide.
    #
    # This member is required.
    HeaderName: str

    # The value for the header that you specified in the HeaderName field.
    #
    # This member is required.
    HeaderValue: str


# A complex type that describes the default cache behavior if you don’t specify a
# CacheBehavior element or if request URLs don’t match any of the values of
# PathPattern in CacheBehavior elements. You must create exactly one default cache
# behavior.
class DefaultCacheBehavior(TypedDict):
    # The value of ID for the origin that you want CloudFront to route requests to
    # when they use the default cache behavior.
    #
    # This member is required.
    TargetOriginId: str

    # The protocol that viewers can use to access the files in the origin specified by
    # TargetOriginId when a request matches the path pattern in PathPattern. You can
    # specify the following options:
    #
    # * allow-all: Viewers can use HTTP or HTTPS.
    #
    # *
    # redirect-to-https: If a viewer submits an HTTP request, CloudFront returns an
    # HTTP status code of 301 (Moved Permanently) to the viewer along with the HTTPS
    # URL. The viewer then resubmits the request using the new URL.
    #
    # * https-only: If
    # a viewer sends an HTTP request, CloudFront returns an HTTP status code of 403
    # (Forbidden).
    #
    # For more information about requiring the HTTPS protocol, see
    # Requiring HTTPS Between Viewers and CloudFront
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-https-viewers-to-cloudfront.html)
    # in the Amazon CloudFront Developer Guide. The only way to guarantee that viewers
    # retrieve an object that was fetched from the origin using HTTPS is never to use
    # any other protocol to fetch the object. If you have recently changed from HTTP
    # to HTTPS, we recommend that you clear your objects’ cache because cached objects
    # are protocol agnostic. That means that an edge location will return an object
    # from the cache regardless of whether the current request protocol matches the
    # protocol used previously. For more information, see Managing Cache Expiration
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
    # in the Amazon CloudFront Developer Guide.
    #
    # This member is required.
    ViewerProtocolPolicy: str

    # A complex type that controls which HTTP methods CloudFront processes and
    # forwards to your Amazon S3 bucket or your custom origin. There are three
    # choices:
    #
    # * CloudFront forwards only GET and HEAD requests.
    #
    # * CloudFront
    # forwards only GET, HEAD, and OPTIONS requests.
    #
    # * CloudFront forwards GET, HEAD,
    # OPTIONS, PUT, PATCH, POST, and DELETE requests.
    #
    # If you pick the third choice,
    # you may need to restrict access to your Amazon S3 bucket or to your custom
    # origin so users can't perform operations that you don't want them to. For
    # example, you might not want users to have permissions to delete objects from
    # your origin.
    AllowedMethods: AllowedMethods

    # The unique identifier of the cache policy that is attached to the default cache
    # behavior. For more information, see Creating cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. A DefaultCacheBehavior must include
    # either a CachePolicyId or ForwardedValues. We recommend that you use a
    # CachePolicyId.
    CachePolicyId: str

    # Whether you want CloudFront to automatically compress certain files for this
    # cache behavior. If so, specify true; if not, specify false. For more
    # information, see Serving Compressed Files
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/ServingCompressedFiles.html)
    # in the Amazon CloudFront Developer Guide.
    Compress: bool

    # This field is deprecated. We recommend that you use the DefaultTTL field in a
    # cache policy instead of this field. For more information, see Creating cache
    # policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. The default amount of time that you
    # want objects to stay in CloudFront caches before CloudFront forwards another
    # request to your origin to determine whether the object has been updated. The
    # value that you specify applies only when your origin does not add HTTP headers
    # such as Cache-Control max-age, Cache-Control s-maxage, and Expires to objects.
    # For more information, see Managing How Long Content Stays in an Edge Cache
    # (Expiration)
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
    # in the Amazon CloudFront Developer Guide.
    #
    # Deprecated: This member has been deprecated.
    DefaultTTL: int

    # The value of ID for the field-level encryption configuration that you want
    # CloudFront to use for encrypting specific fields of data for the default cache
    # behavior.
    FieldLevelEncryptionId: str

    # This field is deprecated. We recommend that you use a cache policy or an origin
    # request policy instead of this field. For more information, see Working with
    # policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/working-with-policies.html)
    # in the Amazon CloudFront Developer Guide. If you want to include values in the
    # cache key, use a cache policy. For more information, see Creating cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. If you want to send values to the
    # origin but not include them in the cache key, use an origin request policy. For
    # more information, see Creating origin request policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-create-origin-request-policy)
    # or Using the managed origin request policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html)
    # in the Amazon CloudFront Developer Guide. A DefaultCacheBehavior must include
    # either a CachePolicyId or ForwardedValues. We recommend that you use a
    # CachePolicyId. A complex type that specifies how CloudFront handles query
    # strings, cookies, and HTTP headers.
    #
    # Deprecated: This member has been deprecated.
    ForwardedValues: dict[str, Any]

    # A list of CloudFront functions that are associated with this cache behavior.
    # CloudFront functions must be published to the LIVE stage to associate them with
    # a cache behavior.
    FunctionAssociations: FunctionAssociations

    # A complex type that contains zero or more Lambda@Edge function associations for
    # a cache behavior.
    LambdaFunctionAssociations: LambdaFunctionAssociations

    # This field is deprecated. We recommend that you use the MaxTTL field in a cache
    # policy instead of this field. For more information, see Creating cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. The maximum amount of time that you
    # want objects to stay in CloudFront caches before CloudFront forwards another
    # request to your origin to determine whether the object has been updated. The
    # value that you specify applies only when your origin adds HTTP headers such as
    # Cache-Control max-age, Cache-Control s-maxage, and Expires to objects. For more
    # information, see Managing How Long Content Stays in an Edge Cache (Expiration)
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
    # in the Amazon CloudFront Developer Guide.
    #
    # Deprecated: This member has been deprecated.
    MaxTTL: int

    # This field is deprecated. We recommend that you use the MinTTL field in a cache
    # policy instead of this field. For more information, see Creating cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. The minimum amount of time that you
    # want objects to stay in CloudFront caches before CloudFront forwards another
    # request to your origin to determine whether the object has been updated. For
    # more information, see Managing How Long Content Stays in an Edge Cache
    # (Expiration)
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
    # in the Amazon CloudFront Developer Guide. You must specify 0 for MinTTL if you
    # configure CloudFront to forward all headers to your origin (under Headers, if
    # you specify 1 for Quantity and * for Name).
    #
    # Deprecated: This member has been deprecated.
    MinTTL: int

    # The unique identifier of the origin request policy that is attached to the
    # default cache behavior. For more information, see Creating origin request
    # policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-create-origin-request-policy)
    # or Using the managed origin request policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html)
    # in the Amazon CloudFront Developer Guide.
    OriginRequestPolicyId: str

    # The Amazon Resource Name (ARN) of the real-time log configuration that is
    # attached to this cache behavior. For more information, see Real-time logs
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/real-time-logs.html)
    # in the Amazon CloudFront Developer Guide.
    RealtimeLogConfigArn: str

    # The identifier for a response headers policy.
    ResponseHeadersPolicyId: str

    # Indicates whether you want to distribute media files in the Microsoft Smooth
    # Streaming format using the origin that is associated with this cache behavior.
    # If so, specify true; if not, specify false. If you specify true for
    # SmoothStreaming, you can still distribute other content using this cache
    # behavior if the content matches the value of PathPattern.
    SmoothStreaming: bool

    # A list of key groups that CloudFront can use to validate signed URLs or signed
    # cookies. When a cache behavior contains trusted key groups, CloudFront requires
    # signed URLs or signed cookies for all requests that match the cache behavior.
    # The URLs or cookies must be signed with a private key whose corresponding public
    # key is in the key group. The signed URL or cookie contains information about
    # which public key CloudFront should use to verify the signature. For more
    # information, see Serving private content
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html)
    # in the Amazon CloudFront Developer Guide.
    TrustedKeyGroups: TrustedKeyGroups

    # We recommend using TrustedKeyGroups instead of TrustedSigners. A list of Amazon
    # Web Services account IDs whose public keys CloudFront can use to validate signed
    # URLs or signed cookies. When a cache behavior contains trusted signers,
    # CloudFront requires signed URLs or signed cookies for all requests that match
    # the cache behavior. The URLs or cookies must be signed with the private key of a
    # CloudFront key pair in a trusted signer’s Amazon Web Services account. The
    # signed URL or cookie contains information about which public key CloudFront
    # should use to verify the signature. For more information, see Serving private
    # content
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html)
    # in the Amazon CloudFront Developer Guide.
    TrustedSigners: TrustedSigners


# A complex type that contains the list of Custom Headers for each origin.
class CustomHeaders(TypedDict):
    # The number of custom headers, if any, for this distribution.
    #
    # This member is required.
    Quantity: int

    # Optional: A list that contains one OriginCustomHeader element for each custom
    # header that you want CloudFront to forward to the origin. If Quantity is 0, omit
    # Items.
    Items: List[OriginCustomHeader]


# A complex type that contains information about the SSL/TLS protocols that
# CloudFront can use when establishing an HTTPS connection with your origin.
class OriginSslProtocols(TypedDict):
    # A list that contains allowed SSL/TLS protocols for this distribution.
    #
    # This member is required.
    Items: List[str]

    # The number of SSL/TLS protocols that you want to allow CloudFront to use when
    # establishing an HTTPS connection with this origin.
    #
    # This member is required.
    Quantity: int


# A custom origin. A custom origin is any origin that is not an Amazon S3 bucket,
# with one exception. An Amazon S3 bucket that is configured with static website
# hosting (https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html) is
# a custom origin.
class CustomOriginConfig(TypedDict):
    # The HTTP port that CloudFront uses to connect to the origin. Specify the HTTP
    # port that the origin listens on.
    #
    # This member is required.
    HTTPPort: int

    # The HTTPS port that CloudFront uses to connect to the origin. Specify the HTTPS
    # port that the origin listens on.
    #
    # This member is required.
    HTTPSPort: int

    # Specifies the protocol (HTTP or HTTPS) that CloudFront uses to connect to the
    # origin. Valid values are:
    #
    # * http-only – CloudFront always uses HTTP to connect
    # to the origin.
    #
    # * match-viewer – CloudFront connects to the origin using the
    # same protocol that the viewer used to connect to CloudFront.
    #
    # * https-only –
    # CloudFront always uses HTTPS to connect to the origin.
    #
    # This member is required.
    OriginProtocolPolicy: str

    # Specifies how long, in seconds, CloudFront persists its connection to the
    # origin. The minimum timeout is 1 second, the maximum is 60 seconds, and the
    # default (if you don’t specify otherwise) is 5 seconds. For more information, see
    # Origin Keep-alive Timeout
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginKeepaliveTimeout)
    # in the Amazon CloudFront Developer Guide.
    OriginKeepaliveTimeout: int

    # Specifies how long, in seconds, CloudFront waits for a response from the origin.
    # This is also known as the origin response timeout. The minimum timeout is 1
    # second, the maximum is 60 seconds, and the default (if you don’t specify
    # otherwise) is 30 seconds. For more information, see Origin Response Timeout
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginResponseTimeout)
    # in the Amazon CloudFront Developer Guide.
    OriginReadTimeout: int

    # Specifies the minimum SSL/TLS protocol that CloudFront uses when connecting to
    # your origin over HTTPS. Valid values include SSLv3, TLSv1, TLSv1.1, and TLSv1.2.
    # For more information, see Minimum Origin SSL Protocol
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginSSLProtocols)
    # in the Amazon CloudFront Developer Guide.
    OriginSslProtocols: OriginSslProtocols


# CloudFront Origin Shield. Using Origin Shield can help reduce the load on your
# origin. For more information, see Using Origin Shield
# (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html)
# in the Amazon CloudFront Developer Guide.
class OriginShield(TypedDict):
    # A flag that specifies whether Origin Shield is enabled. When it’s enabled,
    # CloudFront routes all requests through Origin Shield, which can help protect
    # your origin. When it’s disabled, CloudFront might send requests directly to your
    # origin from multiple edge locations or regional edge caches.
    #
    # This member is required.
    Enabled: bool

    # The Amazon Web Services Region for Origin Shield. Specify the Amazon Web
    # Services Region that has the lowest latency to your origin. To specify a region,
    # use the region code, not the region name. For example, specify the US East
    # (Ohio) region as us-east-2. When you enable CloudFront Origin Shield, you must
    # specify the Amazon Web Services Region for Origin Shield. For the list of Amazon
    # Web Services Regions that you can specify, and for help choosing the best Region
    # for your origin, see Choosing the Amazon Web Services Region for Origin Shield
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#choose-origin-shield-region)
    # in the Amazon CloudFront Developer Guide. \
    OriginShieldRegion: str


# A complex type that contains information about the Amazon S3 origin. If the
# origin is a custom origin or an S3 bucket that is configured as a website
# endpoint, use the CustomOriginConfig element instead.
class S3OriginConfig(TypedDict):
    # The CloudFront origin access identity to associate with the origin. Use an
    # origin access identity to configure the origin so that viewers can only access
    # objects in an Amazon S3 bucket through CloudFront. The format of the value is:
    # origin-access-identity/cloudfront/ID-of-origin-access-identity where
    # ID-of-origin-access-identity  is the value that CloudFront returned in the ID
    # element when you created the origin access identity. If you want viewers to be
    # able to access objects using either the CloudFront URL or the Amazon S3 URL,
    # specify an empty OriginAccessIdentity element. To delete the origin access
    # identity from an existing distribution, update the distribution configuration
    # and include an empty OriginAccessIdentity element. To replace the origin access
    # identity, update the distribution configuration and specify the new origin
    # access identity. For more information about the origin access identity, see
    # Serving Private Content through CloudFront
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html)
    # in the Amazon CloudFront Developer Guide.
    #
    # This member is required. \
    OriginAccessIdentity: str


# An origin. An origin is the location where content is stored, and from which
# CloudFront gets content to serve to viewers. To specify an origin:
#
# * Use
# S3OriginConfig to specify an Amazon S3 bucket that is not configured with static
#  // website hosting.
#
# * Use CustomOriginConfig to specify all other kinds of
# origins, including:
#
# * An Amazon S3 bucket that is configured with static
#  // website hosting
#
# * An Elastic Load Balancing load balancer
#
# * An AWS Elemental
# MediaPackage endpoint
#
# * An AWS Elemental MediaStore container
#
# * Any other HTTP
# server, running on an Amazon EC2 instance or any other kind of host
#
# For the
# current maximum number of origins that you can specify per distribution, see
# General Quotas on Web Distributions
# (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html#limits-web-distributions)
# in the Amazon CloudFront Developer Guide (quotas were formerly referred to as
# limits).
class Origin(TypedDict):
    # The domain name for the origin. For more information, see Origin Domain Name
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesDomainName)
    # in the Amazon CloudFront Developer Guide.
    #
    # This member is required.
    DomainName: str

    # A unique identifier for the origin. This value must be unique within the
    # distribution. Use this value to specify the TargetOriginId in a CacheBehavior or
    # DefaultCacheBehavior.
    #
    # This member is required.
    Id: str

    # The number of times that CloudFront attempts to connect to the origin. The
    # minimum number is 1, the maximum is 3, and the default (if you don’t specify
    # otherwise) is 3. For a custom origin (including an Amazon S3 bucket that’s
    # configured with static website hosting), this value also specifies the number of
    # times that CloudFront attempts to get a response from the origin, in the case of
    # an Origin Response Timeout
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginResponseTimeout).
    # For more information, see Origin Connection Attempts
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#origin-connection-attempts)
    # in the Amazon CloudFront Developer Guide.
    ConnectionAttempts: int

    # The number of seconds that CloudFront waits when trying to establish a
    # connection to the origin. The minimum timeout is 1 second, the maximum is 10
    # seconds, and the default (if you don’t specify otherwise) is 10 seconds. For
    # more information, see Origin Connection Timeout
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#origin-connection-timeout)
    # in the Amazon CloudFront Developer Guide.
    ConnectionTimeout: int

    # A list of HTTP header names and values that CloudFront adds to the requests that
    # it sends to the origin. For more information, see Adding Custom Headers to
    # Origin Requests
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/add-origin-custom-headers.html)
    # in the Amazon CloudFront Developer Guide.
    CustomHeaders: CustomHeaders

    # Use this type to specify an origin that is not an Amazon S3 bucket, with one
    # exception. If the Amazon S3 bucket is configured with static website hosting,
    # use this type. If the Amazon S3 bucket is not configured with static website
    # hosting, use the S3OriginConfig type instead.
    CustomOriginConfig: CustomOriginConfig

    # The unique identifier of an origin access control for this origin. For more
    # information, see Restricting access to an Amazon S3 origin
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
    # in the Amazon CloudFront Developer Guide.
    OriginAccessControlId: str

    # An optional path that CloudFront appends to the origin domain name when
    # CloudFront requests content from the origin. For more information, see Origin
    # Path
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginPath)
    # in the Amazon CloudFront Developer Guide.
    OriginPath: str

    # CloudFront Origin Shield. Using Origin Shield can help reduce the load on your
    # origin. For more information, see Using Origin Shield
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html)
    # in the Amazon CloudFront Developer Guide.
    OriginShield: OriginShield

    # Use this type to specify an origin that is an Amazon S3 bucket that is not
    # configured with static website hosting. To specify any other type of origin,
    # including an Amazon S3 bucket that is configured with static website hosting,
    # use the CustomOriginConfig type instead.
    S3OriginConfig: S3OriginConfig


# Contains information about the origins for this distribution.
class Origins(TypedDict):
    # A list of origins.
    #
    # This member is required.
    Items: List[Origin]

    # The number of origins for this distribution.
    #
    # This member is required.
    Quantity: int


# Amazon Web Services services in China customers must file for an Internet
# Content Provider (ICP) recordal if they want to serve content publicly on an
# alternate domain name, also known as a CNAME, that they've added to CloudFront.
# AliasICPRecordal provides the ICP recordal status for CNAMEs associated with
# distributions. The status is returned in the CloudFront response; you can't
# configure it yourself. For more information about ICP recordals, see  Signup,
# Accounts, and Credentials
# (https://docs.amazonaws.cn/en_us/aws/latest/userguide/accounts-and-credentials.html)
# in Getting Started with Amazon Web Services services in China.
class AliasICPRecordal(TypedDict):
    # A domain name associated with a distribution.
    CNAME: str

    # The Internet Content Provider (ICP) recordal status for a CNAME. The
    # ICPRecordalStatus is set to APPROVED for all CNAMEs (aliases) in regions outside
    # of China. The status values returned are the following:
    #
    # * APPROVED indicates
    # that the associated CNAME has a valid ICP recordal number. Multiple CNAMEs can
    # be associated with a distribution, and CNAMEs can correspond to different ICP
    # recordals. To be marked as APPROVED, that is, valid to use with China region, a
    # CNAME must have one ICP recordal number associated with it.
    #
    # * SUSPENDED
    # indicates that the associated CNAME does not have a valid ICP recordal
    # number.
    #
    # * PENDING indicates that CloudFront can't determine the ICP recordal
    # status of the CNAME associated with the distribution because there was an error
    # in trying to determine the status. You can try again to see if the error is
    # resolved in which case CloudFront returns an APPROVED or SUSPENDED status.
    ICPRecordalStatus: str


# A complex type that contains information about CNAMEs (alternate domain names),
# if any, for this distribution.
class Aliases(TypedDict):
    # The number of CNAME aliases, if any, that you want to associate with this
    # distribution.
    #
    # This member is required.
    Quantity: int

    # A complex type that contains the CNAME aliases, if any, that you want to
    # associate with this distribution.
    Items: List[str]


# A complex type that describes how CloudFront processes requests. You must create
# at least as many cache behaviors (including the default cache behavior) as you
# have origins if you want CloudFront to serve objects from all of the origins.
# Each cache behavior specifies the one origin from which you want CloudFront to
# get objects. If you have two origins and only the default cache behavior, the
# default cache behavior will cause CloudFront to get objects from one of the
# origins, but the other origin is never used. For the current quota (formerly
# known as limit) on the number of cache behaviors that you can add to a
# distribution, see Quotas
# (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html)
# in the Amazon CloudFront Developer Guide. If you don’t want to specify any cache
# behaviors, include only an empty CacheBehaviors element. Don’t include an empty
# CacheBehavior element because this is invalid. To delete all cache behaviors in
# an existing distribution, update the distribution configuration and include only
# an empty CacheBehaviors element. To add, change, or remove one or more cache
# behaviors, update the distribution configuration and specify all of the cache
# behaviors that you want to include in the updated distribution. For more
# information about cache behaviors, see Cache Behavior Settings
# (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesCacheBehavior)
# in the Amazon CloudFront Developer Guide.
class CacheBehavior(TypedDict):
    # The pattern (for example, images/*.jpg) that specifies which requests to apply
    # the behavior to. When CloudFront receives a viewer request, the requested path
    # is compared with path patterns in the order in which cache behaviors are listed
    # in the distribution. You can optionally include a slash (/) at the beginning of
    # the path pattern. For example, /images/*.jpg. CloudFront behavior is the same
    # with or without the leading /. The path pattern for the default cache behavior
    # is * and cannot be changed. If the request for an object does not match the path
    # pattern for any cache behaviors, CloudFront applies the behavior in the default
    # cache behavior. For more information, see Path Pattern
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesPathPattern)
    # in the Amazon CloudFront Developer Guide.
    #
    # This member is required.
    PathPattern: str

    # The value of ID for the origin that you want CloudFront to route requests to
    # when they match this cache behavior.
    #
    # This member is required.
    TargetOriginId: str

    # The protocol that viewers can use to access the files in the origin specified by
    # TargetOriginId when a request matches the path pattern in PathPattern. You can
    # specify the following options:
    #
    # * allow-all: Viewers can use HTTP or HTTPS.
    #
    # *
    # redirect-to-https: If a viewer submits an HTTP request, CloudFront returns an
    # HTTP status code of 301 (Moved Permanently) to the viewer along with the HTTPS
    # URL. The viewer then resubmits the request using the new URL.
    #
    # * https-only: If
    # a viewer sends an HTTP request, CloudFront returns an HTTP status code of 403
    # (Forbidden).
    #
    # For more information about requiring the HTTPS protocol, see
    # Requiring HTTPS Between Viewers and CloudFront
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-https-viewers-to-cloudfront.html)
    # in the Amazon CloudFront Developer Guide. The only way to guarantee that viewers
    # retrieve an object that was fetched from the origin using HTTPS is never to use
    # any other protocol to fetch the object. If you have recently changed from HTTP
    # to HTTPS, we recommend that you clear your objects’ cache because cached objects
    # are protocol agnostic. That means that an edge location will return an object
    # from the cache regardless of whether the current request protocol matches the
    # protocol used previously. For more information, see Managing Cache Expiration
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
    # in the Amazon CloudFront Developer Guide.
    #
    # This member is required.
    ViewerProtocolPolicy: str

    # A complex type that controls which HTTP methods CloudFront processes and
    # forwards to your Amazon S3 bucket or your custom origin. There are three
    # choices:
    #
    # * CloudFront forwards only GET and HEAD requests.
    #
    # * CloudFront
    # forwards only GET, HEAD, and OPTIONS requests.
    #
    # * CloudFront forwards GET, HEAD,
    # OPTIONS, PUT, PATCH, POST, and DELETE requests.
    #
    # If you pick the third choice,
    # you may need to restrict access to your Amazon S3 bucket or to your custom
    # origin so users can't perform operations that you don't want them to. For
    # example, you might not want users to have permissions to delete objects from
    # your origin.
    AllowedMethods: AllowedMethods

    # The unique identifier of the cache policy that is attached to this cache
    # behavior. For more information, see Creating cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. A CacheBehavior must include either a
    # CachePolicyId or ForwardedValues. We recommend that you use a CachePolicyId.
    CachePolicyId: str

    # Whether you want CloudFront to automatically compress certain files for this
    # cache behavior. If so, specify true; if not, specify false. For more
    # information, see Serving Compressed Files
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/ServingCompressedFiles.html)
    # in the Amazon CloudFront Developer Guide.
    Compress: bool

    # This field is deprecated. We recommend that you use the DefaultTTL field in a
    # cache policy instead of this field. For more information, see Creating cache
    # policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. The default amount of time that you
    # want objects to stay in CloudFront caches before CloudFront forwards another
    # request to your origin to determine whether the object has been updated. The
    # value that you specify applies only when your origin does not add HTTP headers
    # such as Cache-Control max-age, Cache-Control s-maxage, and Expires to objects.
    # For more information, see Managing How Long Content Stays in an Edge Cache
    # (Expiration)
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
    # in the Amazon CloudFront Developer Guide.
    #
    # Deprecated: This member has been deprecated.
    DefaultTTL: int

    # The value of ID for the field-level encryption configuration that you want
    # CloudFront to use for encrypting specific fields of data for this cache
    # behavior.
    FieldLevelEncryptionId: str

    # This field is deprecated. We recommend that you use a cache policy or an origin
    # request policy instead of this field. For more information, see Working with
    # policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/working-with-policies.html)
    # in the Amazon CloudFront Developer Guide. If you want to include values in the
    # cache key, use a cache policy. For more information, see Creating cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. If you want to send values to the
    # origin but not include them in the cache key, use an origin request policy. For
    # more information, see Creating origin request policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-create-origin-request-policy)
    # or Using the managed origin request policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html)
    # in the Amazon CloudFront Developer Guide. A CacheBehavior must include either a
    # CachePolicyId or ForwardedValues. We recommend that you use a CachePolicyId. A
    # complex type that specifies how CloudFront handles query strings, cookies, and
    # HTTP headers.
    #
    # Deprecated: This member has been deprecated.
    ForwardedValues: dict[str, Any]

    # A list of CloudFront functions that are associated with this cache behavior.
    # CloudFront functions must be published to the LIVE stage to associate them with
    # a cache behavior.
    FunctionAssociations: FunctionAssociations

    # A complex type that contains zero or more Lambda@Edge function associations for
    # a cache behavior.
    LambdaFunctionAssociations: LambdaFunctionAssociations

    # This field is deprecated. We recommend that you use the MaxTTL field in a cache
    # policy instead of this field. For more information, see Creating cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. The maximum amount of time that you
    # want objects to stay in CloudFront caches before CloudFront forwards another
    # request to your origin to determine whether the object has been updated. The
    # value that you specify applies only when your origin adds HTTP headers such as
    # Cache-Control max-age, Cache-Control s-maxage, and Expires to objects. For more
    # information, see Managing How Long Content Stays in an Edge Cache (Expiration)
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
    # in the Amazon CloudFront Developer Guide.
    #
    # Deprecated: This member has been deprecated.
    MaxTTL: int

    # This field is deprecated. We recommend that you use the MinTTL field in a cache
    # policy instead of this field. For more information, see Creating cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html#cache-key-create-cache-policy)
    # or Using the managed cache policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
    # in the Amazon CloudFront Developer Guide. The minimum amount of time that you
    # want objects to stay in CloudFront caches before CloudFront forwards another
    # request to your origin to determine whether the object has been updated. For
    # more information, see  Managing How Long Content Stays in an Edge Cache
    # (Expiration)
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)
    # in the Amazon CloudFront Developer Guide. You must specify 0 for MinTTL if you
    # configure CloudFront to forward all headers to your origin (under Headers, if
    # you specify 1 for Quantity and * for Name).
    #
    # Deprecated: This member has been deprecated.
    MinTTL: int

    # The unique identifier of the origin request policy that is attached to this
    # cache behavior. For more information, see Creating origin request policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html#origin-request-create-origin-request-policy)
    # or Using the managed origin request policies
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html)
    # in the Amazon CloudFront Developer Guide.
    OriginRequestPolicyId: str

    # The Amazon Resource Name (ARN) of the real-time log configuration that is
    # attached to this cache behavior. For more information, see Real-time logs
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/real-time-logs.html)
    # in the Amazon CloudFront Developer Guide.
    RealtimeLogConfigArn: str

    # The identifier for a response headers policy.
    ResponseHeadersPolicyId: str

    # Indicates whether you want to distribute media files in the Microsoft Smooth
    # Streaming format using the origin that is associated with this cache behavior.
    # If so, specify true; if not, specify false. If you specify true for
    # SmoothStreaming, you can still distribute other content using this cache
    # behavior if the content matches the value of PathPattern.
    SmoothStreaming: bool

    # A list of key groups that CloudFront can use to validate signed URLs or signed
    # cookies. When a cache behavior contains trusted key groups, CloudFront requires
    # signed URLs or signed cookies for all requests that match the cache behavior.
    # The URLs or cookies must be signed with a private key whose corresponding public
    # key is in the key group. The signed URL or cookie contains information about
    # which public key CloudFront should use to verify the signature. For more
    # information, see Serving private content
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html)
    # in the Amazon CloudFront Developer Guide.
    TrustedKeyGroups: TrustedKeyGroups

    # We recommend using TrustedKeyGroups instead of TrustedSigners. A list of Amazon
    # Web Services account IDs whose public keys CloudFront can use to validate signed
    # URLs or signed cookies. When a cache behavior contains trusted signers,
    # CloudFront requires signed URLs or signed cookies for all requests that match
    # the cache behavior. The URLs or cookies must be signed with the private key of a
    # CloudFront key pair in the trusted signer’s Amazon Web Services account. The
    # signed URL or cookie contains information about which public key CloudFront
    # should use to verify the signature. For more information, see Serving private
    # content
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html)
    # in the Amazon CloudFront Developer Guide. \
    TrustedSigners: TrustedSigners


# A complex type that contains zero or more CacheBehavior elements.
class CacheBehaviors(TypedDict):
    # The number of cache behaviors for this distribution.
    #
    # This member is required.
    Quantity: int

    # Optional: A complex type that contains cache behaviors for this distribution. If
    # Quantity is 0, you can omit Items.
    Items: List[CacheBehavior]


# A complex type that controls:
#
# * Whether CloudFront replaces HTTP status codes
# in the 4xx and 5xx range with custom error messages before returning the
# response to the viewer.
#
# * How long CloudFront caches HTTP status codes in the
# 4xx and 5xx range.
#
# For more information about custom error pages, see
# Customizing Error Responses
# (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/custom-error-pages.html)
# in the Amazon CloudFront Developer Guide.
class CustomErrorResponse(TypedDict):
    # The HTTP status code for which you want to specify a custom error page and/or a
    # caching duration.
    #
    # This member is required.
    ErrorCode: int

    # The minimum amount of time, in seconds, that you want CloudFront to cache the
    # HTTP status code specified in ErrorCode. When this time period has elapsed,
    # CloudFront queries your origin to see whether the problem that caused the error
    # has been resolved and the requested object is now available. For more
    # information, see Customizing Error Responses
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/custom-error-pages.html)
    # in the Amazon CloudFront Developer Guide.
    ErrorCachingMinTTL: int

    # The HTTP status code that you want CloudFront to return to the viewer along with
    # the custom error page. There are a variety of reasons that you might want
    # CloudFront to return a status code different from the status code that your
    # origin returned to CloudFront, for example:
    #
    # * Some Internet devices (some
    # firewalls and corporate proxies, for example) intercept HTTP 4xx and 5xx and
    # prevent the response from being returned to the viewer. If you substitute 200,
    # the response typically won't be intercepted.
    #
    # * If you don't care about
    # distinguishing among different client errors or server errors, you can specify
    # 400 or 500 as the ResponseCode for all 4xx or 5xx errors.
    #
    # * You might want to
    # return a 200 status code (OK) and static website so your customers don't know
    # that your website is down.
    #
    # If you specify a value for ResponseCode, you must
    # also specify a value for ResponsePagePath.
    ResponseCode: str

    # The path to the custom error page that you want CloudFront to return to a viewer
    # when your origin returns the HTTP status code specified by ErrorCode, for
    # example, /4xx-errors/403-forbidden.html. If you want to store your objects and
    # your custom error pages in different locations, your distribution must include a
    # cache behavior for which the following is true:
    #
    # * The value of PathPattern
    # matches the path to your custom error messages. For example, suppose you saved
    # custom error pages for 4xx errors in an Amazon S3 bucket in a directory named
    # /4xx-errors. Your distribution must include a cache behavior for which the path
    # pattern routes requests for your custom error pages to that location, for
    # example, /4xx-errors/*.
    #
    # * The value of TargetOriginId specifies the value of
    # the ID element for the origin that contains your custom error pages.
    #
    # If you
    # specify a value for ResponsePagePath, you must also specify a value for
    # ResponseCode. We recommend that you store custom error pages in an Amazon S3
    # bucket. If you store custom error pages on an HTTP server and the server starts
    # to return 5xx errors, CloudFront can't get the files that you want to return to
    # viewers because the origin server is unavailable.
    ResponsePagePath: str


# A complex type that controls:
#
# * Whether CloudFront replaces HTTP status codes
# in the 4xx and 5xx range with custom error messages before returning the
# response to the viewer.
#
# * How long CloudFront caches HTTP status codes in the
# 4xx and 5xx range.
#
# For more information about custom error pages, see
# Customizing Error Responses
# (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/custom-error-pages.html)
# in the Amazon CloudFront Developer Guide.
class CustomErrorResponses(TypedDict):
    # The number of HTTP status codes for which you want to specify a custom error
    # page and/or a caching duration. If Quantity is 0, you can omit Items.
    #
    # This member is required.
    Quantity: int

    # A complex type that contains a CustomErrorResponse element for each HTTP status
    # code for which you want to specify a custom error page and/or a caching
    # duration.
    Items: List[CustomErrorResponse]


# A complex data type for the status codes that you specify that, when returned by
# a primary origin, trigger CloudFront to failover to a second origin.
class StatusCodes(TypedDict):
    # The items (status codes) for an origin group.
    #
    # This member is required.
    Items: List[int]

    # The number of status codes.
    #
    # This member is required.
    Quantity: int


# A complex data type that includes information about the failover criteria for an
# origin group, including the status codes for which CloudFront will failover from
# the primary origin to the second origin.
class OriginGroupFailoverCriteria(TypedDict):
    # The status codes that, when returned from the primary origin, will trigger
    # CloudFront to failover to the second origin.
    #
    # This member is required. \
    StatusCodes: StatusCodes


# An origin in an origin group.
class OriginGroupMember(TypedDict):
    # The ID for an origin in an origin group.
    #
    # This member is required.
    OriginId: str


# A complex data type for the origins included in an origin group.
class OriginGroupMembers(TypedDict):
    # Items (origins) in an origin group.
    #
    # This member is required.
    Items: List[OriginGroupMember]

    # The number of origins in an origin group.
    #
    # This member is required. \
    Quantity: int


# An origin group includes two origins (a primary origin and a second origin to
# failover to) and a failover criteria that you specify. You create an origin
# group to support origin failover in CloudFront. When you create or update a
# distribution, you can specifiy the origin group instead of a single origin, and
# CloudFront will failover from the primary origin to the second origin under the
# failover conditions that you've chosen.
class OriginGroup(TypedDict):
    # A complex type that contains information about the failover criteria for an
    # origin group.
    #
    # This member is required.
    FailoverCriteria: OriginGroupFailoverCriteria

    # The origin group's ID.
    #
    # This member is required.
    Id: str

    # A complex type that contains information about the origins in an origin group.
    #
    # This member is required.
    Members: OriginGroupMembers


# A complex type that controls whether access logs are written for the
# distribution.
class LoggingConfig(TypedDict):
    # The Amazon S3 bucket to store the access logs in, for example,
    # myawslogbucket.s3.amazonaws.com.
    #
    # This member is required.
    Bucket: str

    # Specifies whether you want CloudFront to save access logs to an Amazon S3
    # bucket. If you don't want to enable logging when you create a distribution or if
    # you want to disable logging for an existing distribution, specify false for
    # Enabled, and specify empty Bucket and Prefix elements. If you specify false for
    # Enabled. but you specify values for Bucket, prefix, and IncludeCookies, the
    # values are automatically deleted.
    #
    # This member is required.
    Enabled: bool

    # Specifies whether you want CloudFront to include cookies in access logs, specify
    # true for IncludeCookies. If you choose to include cookies in logs, CloudFront
    # logs all cookies regardless of how you configure the cache behaviors for this
    # distribution. If you don't want to include cookies when you create a
    # distribution or if you want to disable include cookies for an existing
    # distribution, specify false for IncludeCookies.
    #
    # This member is required.
    IncludeCookies: bool

    # An optional string that you want CloudFront to prefix to the access log
    # filenames for this distribution, for example, myprefix/. If you want to enable
    # logging, but you don't want to specify a prefix, you still must include an empty
    # Prefix element in the Logging element.
    #
    # This member is required.
    Prefix: str


# A complex data type for the origin groups specified for a distribution.
class OriginGroups(TypedDict):
    # The number of origin groups.
    #
    # This member is required.
    Quantity: int

    # The items (origin groups) in a distribution.
    Items: List[OriginGroup]


# A distribution configuration.
class DistributionConfig(TypedDict):
    # A unique value (for example, a date-time stamp) that ensures that the request
    # can't be replayed. If the value of CallerReference is new (regardless of the
    # content of the DistributionConfig object), CloudFront creates a new
    # distribution. If CallerReference is a value that you already sent in a previous
    # request to create a distribution, CloudFront returns a DistributionAlreadyExists
    # error.
    #
    # This member is required.
    CallerReference: str

    # An optional comment to describe the distribution. The comment cannot be longer
    # than 128 characters.
    #
    # This member is required.
    Comment: str

    # A complex type that describes the default cache behavior if you don't specify a
    # CacheBehavior element or if files don't match any of the values of PathPattern
    # in CacheBehavior elements. You must create exactly one default cache behavior.
    #
    # This member is required.
    DefaultCacheBehavior: DefaultCacheBehavior

    # From this field, you can enable or disable the selected distribution.
    #
    # This member is required.
    Enabled: bool

    # A complex type that contains information about origins for this distribution.
    #
    # This member is required.
    Origins: Origins

    # A complex type that contains information about CNAMEs (alternate domain names),
    # if any, for this distribution.
    Aliases: Aliases

    # A complex type that contains zero or more CacheBehavior elements.
    CacheBehaviors: CacheBehaviors

    # A complex type that controls the following:
    #
    # * Whether CloudFront replaces HTTP
    # status codes in the 4xx and 5xx range with custom error messages before
    # returning the response to the viewer.
    #
    # * How long CloudFront caches HTTP status
    # codes in the 4xx and 5xx range.
    #
    # For more information about custom error pages,
    # see Customizing Error Responses
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/custom-error-pages.html)
    # in the Amazon CloudFront Developer Guide.
    CustomErrorResponses: CustomErrorResponses

    # The object that you want CloudFront to request from your origin (for example,
    # index.html) when a viewer requests the root URL for your distribution
    # (http://www.example.com) instead of an object in your distribution
    # (http://www.example.com/product-description.html). Specifying a default root
    # object avoids exposing the contents of your distribution. Specify only the
    # object name, for example, index.html. Don't add a / before the object name. If
    # you don't want to specify a default root object when you create a distribution,
    # include an empty DefaultRootObject element. To delete the default root object
    # from an existing distribution, update the distribution configuration and include
    # an empty DefaultRootObject element. To replace the default root object, update
    # the distribution configuration and specify the new object. For more information
    # about the default root object, see Creating a Default Root Object
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DefaultRootObject.html)
    # in the Amazon CloudFront Developer Guide.
    DefaultRootObject: str

    # (Optional) Specify the maximum HTTP version(s) that you want viewers to use to
    # communicate with CloudFront. The default value for new web distributions is
    # http2. Viewers that don't support HTTP/2 automatically use an earlier HTTP
    # version. For viewers and CloudFront to use HTTP/2, viewers must support TLSv1.2
    # or later, and must support Server Name Indication (SNI). For viewers and
    # CloudFront to use HTTP/3, viewers must support TLSv1.3 and Server Name
    # Indication (SNI). CloudFront supports HTTP/3 connection migration to allow the
    # viewer to switch networks without losing connection. For more information about
    # connection migration, see Connection Migration
    # (https://www.rfc-editor.org/rfc/rfc9000.html#name-connection-migration) at RFC
    # 9000. For more information about supported TLSv1.3 ciphers, see Supported
    # protocols and ciphers between viewers and CloudFront
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/secure-connections-supported-viewer-protocols-ciphers.html).
    HttpVersion: str

    # If you want CloudFront to respond to IPv6 DNS requests with an IPv6 address for
    # your distribution, specify true. If you specify false, CloudFront responds to
    # IPv6 DNS requests with the DNS response code NOERROR and with no IP addresses.
    # This allows viewers to submit a second request, for an IPv4 address for your
    # distribution. In general, you should enable IPv6 if you have users on IPv6
    # networks who want to access your content. However, if you're using signed URLs
    # or signed cookies to restrict access to your content, and if you're using a
    # custom policy that includes the IpAddress parameter to restrict the IP addresses
    # that can access your content, don't enable IPv6. If you want to restrict access
    # to some content by IP address and not restrict access to other content (or
    # restrict access but not by IP address), you can create two distributions. For
    # more information, see Creating a Signed URL Using a Custom Policy
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-creating-signed-url-custom-policy.html)
    # in the Amazon CloudFront Developer Guide. If you're using an Route 53 Amazon Web
    # Services Integration alias resource record set to route traffic to your
    # CloudFront distribution, you need to create a second alias resource record set
    # when both of the following are true:
    #
    # * You enable IPv6 for the distribution
    #
    # *
    # You're using alternate domain names in the URLs for your objects
    #
    # For more
    # information, see Routing Traffic to an Amazon CloudFront Web Distribution by
    # Using Your Domain Name
    # (https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-cloudfront-distribution.html)
    # in the Route 53 Amazon Web Services Integration Developer Guide. If you created
    # a CNAME resource record set, either with Route 53 Amazon Web Services
    # Integration or with another DNS service, you don't need to make any changes. A
    # CNAME record will route traffic to your distribution regardless of the IP
    # address format of the viewer request.
    IsIPV6Enabled: bool

    # A complex type that controls whether access logs are written for the
    # distribution. For more information about logging, see Access Logs
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html)
    # in the Amazon CloudFront Developer Guide.
    Logging: LoggingConfig

    # A complex type that contains information about origin groups for this
    # distribution.
    OriginGroups: OriginGroups

    # The price class that corresponds with the maximum price that you want to pay for
    # CloudFront service. If you specify PriceClass_All, CloudFront responds to
    # requests for your objects from all CloudFront edge locations. If you specify a
    # price class other than PriceClass_All, CloudFront serves your objects from the
    # CloudFront edge location that has the lowest latency among the edge locations in
    # your price class. Viewers who are in or near regions that are excluded from your
    # specified price class may encounter slower performance. For more information
    # about price classes, see Choosing the Price Class for a CloudFront Distribution
    # (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PriceClass.html)
    # in the Amazon CloudFront Developer Guide. For information about CloudFront
    # pricing, including how price classes (such as Price Class 100) map to CloudFront
    # regions, see Amazon CloudFront Pricing
    # (http://aws.amazon.com/cloudfront/pricing/).
    PriceClass: str

    # A complex type that identifies ways in which you want to restrict distribution
    # of your content.
    Restrictions: Restrictions

    # A complex type that determines the distribution’s SSL/TLS configuration for
    # communicating with viewers.
    ViewerCertificate: dict[str, Any]

    # A unique identifier that specifies the WAF web ACL, if any, to associate with
    # this distribution. To specify a web ACL created using the latest version of WAF,
    # use the ACL ARN, for example
    # arn:aws:wafv2:us-east-1:123456789012:global/webacl/ExampleWebACL/473e64fd-f30b-4765-81a0-62ad96dd167a.
    # To specify a web ACL created using WAF Classic, use the ACL ID, for example
    # 473e64fd-f30b-4765-81a0-62ad96dd167a. WAF is a web application firewall that
    # lets you monitor the HTTP and HTTPS requests that are forwarded to CloudFront,
    # and lets you control access to your content. Based on conditions that you
    # specify, such as the IP addresses that requests originate from or the values of
    # query strings, CloudFront responds to requests either with the requested content
    # or with an HTTP 403 status code (Forbidden). You can also configure CloudFront
    # to return a custom error page when a request is blocked. For more information
    # about WAF, see the WAF Developer Guide
    # (https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html).
    WebACLId: str


# A distribution tells CloudFront where you want content to be delivered from, and
# the details about how to track and manage content delivery.
class Distribution(TypedDict):
    # The ARN (Amazon Resource Name) for the distribution. For example:
    # arn:aws:cloudfront::123456789012:distribution/EDFDVBD632BHDS5, where
    # 123456789012 is your Amazon Web Services account ID.
    #
    # This member is required.
    ARN: str

    # The current configuration information for the distribution. Send a GET request
    # to the /CloudFront API version/distribution ID/config resource.
    #
    # This member is required.
    DistributionConfig: DistributionConfig

    # The domain name corresponding to the distribution, for example,
    # d111111abcdef8.cloudfront.net.
    #
    # This member is required.
    DomainName: str

    # The identifier for the distribution. For example: EDFDVBD632BHDS5.
    #
    # This member is required.
    Id: str

    # The number of invalidation batches currently in progress.
    #
    # This member is required.
    InProgressInvalidationBatches: int

    # The date and time the distribution was last modified.
    #
    # This member is required.
    LastModifiedTime: datetime.time

    # This response element indicates the current status of the distribution. When the
    # status is Deployed, the distribution's information is fully propagated to all
    # CloudFront edge locations.
    #
    # This member is required.
    Status: str

    # CloudFront automatically adds this field to the response if you’ve configured a
    # cache behavior in this distribution to serve private content using key groups.
    # This field contains a list of key groups and the public keys in each key group
    # that CloudFront can use to verify the signatures of signed URLs or signed
    # cookies.
    ActiveTrustedKeyGroups: ActiveTrustedKeyGroups

    # We recommend using TrustedKeyGroups instead of TrustedSigners. CloudFront
    # automatically adds this field to the response if you’ve configured a cache
    # behavior in this distribution to serve private content using trusted signers.
    # This field contains a list of Amazon Web Services account IDs and the active
    # CloudFront key pairs in each account that CloudFront can use to verify the
    # signatures of signed URLs or signed cookies.
    ActiveTrustedSigners: ActiveTrustedSigners

    # Amazon Web Services services in China customers must file for an Internet
    # Content Provider (ICP) recordal if they want to serve content publicly on an
    # alternate domain name, also known as a CNAME, that they've added to CloudFront.
    # AliasICPRecordal provides the ICP recordal status for CNAMEs associated with
    # distributions. For more information about ICP recordals, see  Signup, Accounts,
    # and Credentials
    # (https://docs.amazonaws.cn/en_us/aws/latest/userguide/accounts-and-credentials.html)
    # in Getting Started with Amazon Web Services services in China.
    AliasICPRecordals: List[AliasICPRecordal]


# The returned result of the corresponding request.
class GetDistributionOutput(TypedDict):
    # The distribution's information.
    Distribution: Distribution

    # The current version of the distribution's information. For example:
    # E2QWRUHAPOMQZL.
    ETag: str

    # Metadata pertaining to the operation's result.
    ResponseMetadata: ResponseMetadata


# The returned result of the corresponding request.
class GetDistributionConfigOutput (TypedDict):
    # The distribution's configuration information.
    DistributionConfig: DistributionConfig

    # The current version of the configuration. For example: E2QWRUHAPOMQZL.
    ETag: str

    # Metadata pertaining to the operation's result.
    ResponseMetadata: ResponseMetadata


# A complex type that contains Tag key and Tag value.
class Tag(TypedDict):

    # A string that contains Tag key. The string length should be between 1 and 128
    # characters. Valid characters include a-z, A-Z, 0-9, space, and the special
    # characters _ - . : / = + @.
    #
    # This member is required.
    Key: str

    # A string that contains an optional Tag value. The string length should be
    # between 0 and 256 characters. Valid characters include a-z, A-Z, 0-9, space, and
    # the special characters _ - . : / = + @.
    Value: str


# A complex type that contains zero or more Tag elements.
class Tags(TypedDict):

    # A complex type that contains Tag elements.
    Items: List[Tag]


# A distribution Configuration and a list of tags to be associated with the
# distribution.
class DistributionConfigWithTags(TypedDict):
    # A distribution configuration.
    #
    # This member is required.
    DistributionConfig: DistributionConfig

    # A complex type that contains zero or more Tag elements.
    #
    # This member is required.
    Tags: Tags


# The returned result of the corresponding request.
class CreateDistributionWithTagsOutput(TypedDict):

    # The distribution's information.
    Distribution: Distribution

    # The current version of the distribution created.
    ETag: str

    # The fully qualified URI of the new distribution resource just created.
    Location: str

    # Metadata pertaining to the operation's result.
    ResponseMetadata: ResponseMetadata

