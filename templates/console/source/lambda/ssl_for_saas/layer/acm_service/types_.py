import datetime
from typing import List, TypedDict, NamedTuple, Any

from layer.common.types_ import ResponseMetadata


class CertificateSummary(TypedDict):
    # Amazon Resource Name (ARN) of the certificate. This is of the form:
    # arn:aws:acm:region:123456789012:certificate/12345678-1234-1234-1234-123456789012
    # For more information about ARNs, see Amazon Resource Names (ARNs)
    # (https:#docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html).
    CertificateArn: str

    # The time at which the certificate was requested.
    CreatedAt: datetime.time

    # Fully qualified domain name (FQDN), such as www.example.com or example.com, for
    # the certificate.
    DomainName: str

    # Indicates whether the certificate has been exported. This value exists only when
    # the certificate type is PRIVATE.
    Exported: bool

    # Contains a list of Extended Key Usage X.509 v3 extension objects. Each object
    # specifies a purpose for which the certificate public key can be used and
    # consists of a name and an object identifier (OID).
    ExtendedKeyUsages: List[str]

    # When called by ListCertificates
    # (https:#docs.aws.amazon.com/acm/latestAPIReference/API_ListCertificates.html),
    # indicates whether the full list of subject alternative names has been included
    # in the response. If false, the response includes all of the subject alternative
    # names included in the certificate. If true, the response only includes the first
    # 100 subject alternative names included in the certificate. To display the full
    # list of subject alternative names, use DescribeCertificate
    # (https:#docs.aws.amazon.com/acm/latestAPIReference/API_DescribeCertificate.html).
    HasAdditionalSubjectAlternativeNames: bool

    # The date and time when the certificate was imported. This value exists only when
    # the certificate type is IMPORTED.
    ImportedAt: datetime.time

    # Indicates whether the certificate is currently in use by any Amazon Web Services
    # resources.
    InUse: bool

    # The time at which the certificate was issued. This value exists only when the
    # certificate type is AMAZON_ISSUED.
    IssuedAt: datetime.time

    # The algorithm that was used to generate the public-private key pair.
    #   "RSA_1024"
    # 	"RSA_2048"
    # 	"RSA_3072"
    # 	"RSA_4096"
    # 	"EC_prime256v1"
    # 	"EC_secp384r1"
    # 	"EC_secp521r1"
    KeyAlgorithm: str

    # A list of Key Usage X.509 v3 extension objects. Each object is a string value
    # that identifies the purpose of the public key contained in the certificate.
    # Possible extension values include DIGITAL_SIGNATURE, KEY_ENCHIPHERMENT,
    # NON_REPUDIATION, and more.
    KeyUsages: List[str]

    # The time after which the certificate is not valid.
    NotAfter: datetime.time

    # The time before which the certificate is not valid.
    NotBefore: datetime.time

    # Specifies whether the certificate is eligible for renewal. At this time, only
    # exported private certificates can be renewed with the RenewCertificate command.
    RenewalEligibility: str

    # The time at which the certificate was revoked. This value exists only when the
    # certificate status is REVOKED.
    RevokedAt: datetime.time

    # The status of the certificate. A certificate enters status PENDING_VALIDATION
    # upon being requested, unless it fails for any of the reasons given in the
    # troubleshooting topic Certificate request fails
    # (https:#docs.aws.amazon.com/acm/latest/userguide/troubleshooting-failed.html).
    # ACM makes repeated attempts to validate a certificate for 72 hours and then
    # times out. If a certificate shows status FAILED or VALIDATION_TIMED_OUT, delete
    # the request, correct the issue with DNS validation
    # (https:#docs.aws.amazon.com/acm/latest/userguide/dns-validation.html) or Email
    # validation
    # (https:#docs.aws.amazon.com/acm/latest/userguide/email-validation.html), and
    # try again. If validation succeeds, the certificate enters status ISSUED.
    Status: str

    # One or more domain names (subject alternative names) included in the
    # certificate. This list contains the domain names that are bound to the public
    # key that is contained in the certificate. The subject alternative names include
    # the canonical domain name (CN) of the certificate and additional domain names
    # that can be used to connect to the website. When called by ListCertificates
    # (https:#docs.aws.amazon.com/acm/latestAPIReference/API_ListCertificates.html),
    # this parameter will only return the first 100 subject alternative names included
    # in the certificate. To display the full list of subject alternative names, use
    # DescribeCertificate
    # (https:#docs.aws.amazon.com/acm/latestAPIReference/API_DescribeCertificate.html).
    SubjectAlternativeNameSummaries: List[str]

    # The source of the certificate. For certificates provided by ACM, this value is
    # AMAZON_ISSUED. For certificates that you imported with ImportCertificate, this
    # value is IMPORTED. ACM does not provide managed renewal
    # (https:#docs.aws.amazon.com/acm/latest/userguide/acm-renewal.html) for imported
    # certificates. For more information about the differences between certificates
    # that you import and those that ACM provides, see Importing Certificates
    # (https:#docs.aws.amazon.com/acm/latest/userguide/import-certificate.html) in
    # the Certificate Manager User Guide.
    Type: str


# Contains a DNS record value that you can use to validate ownership or control of
# a domain. This is used by the DescribeCertificate action.
class ResourceRecord(TypedDict):
    # The name of the DNS record to create in your domain. This is supplied by ACM.
    #
    # This member is required.
    Name: str

    # The type of DNS record. Currently this can be CNAME.
    #
    # This member is required.
    Type: str

    # The value of the CNAME record to add to your DNS database. This is supplied by
    # ACM.
    #
    # This member is required.
    Value: str


# Contains information about the validation of each domain name in the
# certificate.
class DomainValidation(TypedDict):
    # A fully qualified domain name (FQDN) in the certificate. For example,
    # www.example.com or example.com.
    #
    # This member is required.
    DomainName: str

    # Contains the CNAME record that you add to your DNS database for domain
    # validation. For more information, see Use DNS to Validate Domain Ownership
    # (https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-validate-dns.html).
    # Note: The CNAME information that you need does not include the name of your
    # domain. If you include your domain name in the DNS database CNAME record,
    # validation fails. For example, if the name is
    # "_a79865eb4cd1a6ab990a45779b4e0b96.yourdomain.com", only
    # "_a79865eb4cd1a6ab990a45779b4e0b96" must be used.
    ResourceRecord: ResourceRecord

    # The domain name that ACM used to send domain validation emails.
    ValidationDomain: str

    # A list of email addresses that ACM used to send domain validation emails.
    ValidationEmails: List[str]

    # Specifies the domain validation method.
    ValidationMethod: str

    # The validation status of the domain name. This can be one of the following
    # values:
    # /
    # * PENDING_VALIDATION
    #
    # * SUCCESS
    #
    # * FAILED
    ValidationStatus: str


# The Extended Key Usage X.509 v3 extension defines one or more purposes for which
# the public key can be used. This is in addition to or in place of the basic
# purposes specified by the Key Usage extension.
class ExtendedKeyUsage(TypedDict):
    # The name of an Extended Key Usage value.
    Name: str

    # An object identifier (OID) for the extension value. OIDs are strings of numbers
    # separated by periods. The following OIDs are defined in RFC 3280 and RFC
    # 5280.
    #
    # * 1.3.6.1.5.5.7.3.1 (TLS_WEB_SERVER_AUTHENTICATION)
    #
    # * 1.3.6.1.5.5.7.3.2
    # (TLS_WEB_CLIENT_AUTHENTICATION)
    #
    # * 1.3.6.1.5.5.7.3.3 (CODE_SIGNING)
    #
    # *
    # 1.3.6.1.5.5.7.3.4 (EMAIL_PROTECTION)
    #
    # * 1.3.6.1.5.5.7.3.8 (TIME_STAMPING)
    #
    # *
    # 1.3.6.1.5.5.7.3.9 (OCSP_SIGNING)
    #
    # * 1.3.6.1.5.5.7.3.5 (IPSEC_END_SYSTEM)
    #
    # *
    # 1.3.6.1.5.5.7.3.6 (IPSEC_TUNNEL)
    #
    # * 1.3.6.1.5.5.7.3.7 (IPSEC_USER)
    OID: str


# The Key Usage X.509 v3 extension defines the purpose of the public key contained
# in the certificate.
class KeyUsage(TypedDict):
    # A string value that contains a Key Usage extension name.
    Name: str


# Structure that contains options for your certificate. Currently, you can use
# this only to specify whether to opt in to or out of certificate transparency
# logging. Some browsers require that public certificates issued for your domain
# be recorded in a log. Certificates that are not logged typically generate a
# browser error. Transparency makes it possible for you to detect SSL/TLS
# certificates that have been mistakenly or maliciously issued for your domain.
# For general information, see Certificate Transparency Logging
# (https://docs.aws.amazon.com/acm/latest/userguide/acm-concepts.html#concept-transparency).
class CertificateOptions(TypedDict):
    # You can opt out of certificate transparency logging by specifying the DISABLED
    # option. Opt in by specifying ENABLED.
    CertificateTransparencyLoggingPreference: str


# Contains information about the status of ACM's managed renewal
# (https://docs.aws.amazon.com/acm/latest/userguide/acm-renewal.html) for the
# certificate. This structure exists only when the certificate type is
# AMAZON_ISSUED.
class RenewalSummary(TypedDict):
    # Contains information about the validation of each domain name in the
    # certificate, as it pertains to ACM's managed renewal
    # (https://docs.aws.amazon.com/acm/latest/userguide/acm-renewal.html). This is
    # different from the initial validation that occurs as a result of the
    # RequestCertificate request. This field exists only when the certificate type is
    # AMAZON_ISSUED.
    #
    # This member is required.
    DomainValidationOptions: DomainValidation

    # The status of ACM's managed renewal
    # (https://docs.aws.amazon.com/acm/latest/userguide/acm-renewal.html) of the
    # certificate.
    #
    # This member is required.
    RenewalStatus: str

    # The time at which the renewal summary was last updated.
    #
    # This member is required.
    UpdatedAt: datetime.time

    # The reason that a renewal request was unsuccessful.
    RenewalStatusReason: str


# Contains metadata about an ACM certificate. This structure is returned in the
# response to a DescribeCertificate request.
class CertificateDetail(TypedDict):
    # The Amazon Resource Name (ARN) of the certificate. For more information about
    # ARNs, see Amazon Resource Names (ARNs)
    # (https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html) in
    # the Amazon Web Services General Reference.
    CertificateArn: str

    # The Amazon Resource Name (ARN) of the private certificate authority (CA) that
    # issued the certificate. This has the following format:
    # arn:aws:acm-pca:region:account:certificate-authority/12345678-1234-1234-1234-123456789012
    CertificateAuthorityArn: str

    # The time at which the certificate was requested.
    CreatedAt: datetime.time

    # The fully qualified domain name for the certificate, such as www.example.com or
    # example.com.
    DomainName: str

    # Contains information about the initial validation of each domain name that
    # occurs as a result of the RequestCertificate request. This field exists only
    # when the certificate type is AMAZON_ISSUED.
    DomainValidationOptions: List[DomainValidation]

    # Contains a list of Extended Key Usage X.509 v3 extension objects. Each object
    # specifies a purpose for which the certificate public key can be used and
    # consists of a name and an object identifier (OID).
    ExtendedKeyUsages: List[ExtendedKeyUsage]

    # The reason the certificate request failed. This value exists only when the
    # certificate status is FAILED. For more information, see Certificate Request
    # Failed
    # (https://docs.aws.amazon.com/acm/latest/userguide/troubleshooting.html#troubleshooting-failed)
    # in the Certificate Manager User Guide.
    FailureReason: str

    # The date and time when the certificate was imported. This value exists only when
    # the certificate type is IMPORTED.
    ImportedAt: datetime.time

    # A list of ARNs for the Amazon Web Services resources that are using the
    # certificate. A certificate can be used by multiple Amazon Web Services
    # resources.
    InUseBy: List[str]

    # The time at which the certificate was issued. This value exists only when the
    # certificate type is AMAZON_ISSUED.
    IssuedAt: datetime.time

    # The name of the certificate authority that issued and signed the certificate.
    Issuer: str

    # The algorithm that was used to generate the public-private key pair.
    KeyAlgorithm: str

    # A list of Key Usage X.509 v3 extension objects. Each object is a string value
    # that identifies the purpose of the public key contained in the certificate.
    # Possible extension values include DIGITAL_SIGNATURE, KEY_ENCHIPHERMENT,
    # NON_REPUDIATION, and more.
    KeyUsages: List[KeyUsage]

    # The time after which the certificate is not valid.
    NotAfter: datetime.time

    # The time before which the certificate is not valid.
    NotBefore: datetime.time

    # Value that specifies whether to add the certificate to a transparency log.
    # Certificate transparency makes it possible to detect SSL certificates that have
    # been mistakenly or maliciously issued. A browser might respond to certificate
    # that has not been logged by showing an error message. The logs are
    # cryptographically secure.
    Options: CertificateOptions

    # Specifies whether the certificate is eligible for renewal. At this time, only
    # exported private certificates can be renewed with the RenewCertificate command.
    RenewalEligibility: str

    # Contains information about the status of ACM's managed renewal
    # (https://docs.aws.amazon.com/acm/latest/userguide/acm-renewal.html) for the
    # certificate. This field exists only when the certificate type is AMAZON_ISSUED.
    RenewalSummary: RenewalSummary

    # The reason the certificate was revoked. This value exists only when the
    # certificate status is REVOKED.
    RevocationReason: str

    # The time at which the certificate was revoked. This value exists only when the
    # certificate status is REVOKED.
    RevokedAt: datetime.time

    ## The serial number of the certificate.
    Serial: str

    # The algorithm that was used to sign the certificate.
    SignatureAlgorithm: str

    # The status of the certificate. A certificate enters status PENDING_VALIDATION
    # upon being requested, unless it fails for any of the reasons given in the
    # troubleshooting topic Certificate request fails
    # (https://docs.aws.amazon.com/acm/latest/userguide/troubleshooting-failed.html).
    # ACM makes repeated attempts to validate a certificate for 72 hours and then
    # times out. If a certificate shows status FAILED or VALIDATION_TIMED_OUT, delete
    # the request, correct the issue with DNS validation
    # (https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html) or Email
    # validation
    # (https://docs.aws.amazon.com/acm/latest/userguide/email-validation.html), and
    # try again. If validation succeeds, the certificate enters status ISSUED.
    Status: str

    # The name of the entity that is associated with the public key contained in the
    # certificate.
    Subject: str

    # One or more domain names (subject alternative names) included in the
    # certificate. This list contains the domain names that are bound to the public
    # key that is contained in the certificate. The subject alternative names include
    # the canonical domain name (CN) of the certificate and additional domain names
    # that can be used to connect to the website.
    SubjectAlternativeNames: str

    # The source of the certificate. For certificates provided by ACM, this value is
    # AMAZON_ISSUED. For certificates that you imported with ImportCertificate, this
    #   value is IMPORTED. ACM does not provide managed renewal
    # (https://docs.aws.amazon.com/acm/latest/userguide/acm-renewal.html) for imported
    #   certificates. For more information about the differences between certificates
    # that you import and those that ACM provides, see Importing Certificates
    # (https://docs.aws.amazon.com/acm/latest/userguide/import-certificate.html) in
    # the Certificate Manager User Guide.
    Type: str


class DescribeCertificateOutput(TypedDict):
    # Metadata about an ACM certificate.
    Certificate: CertificateDetail

    # Metadata pertaining to the operation's result.
    ResponseMetadata: ResponseMetadata


class ListCertificateSummaryOutput(TypedDict):
    # Metadata pertaining to the operation's result.
    ResponseMetadata: ResponseMetadata

    # A list of ACM certificates.
    CertificateSummaryList: List[CertificateSummary]


class RequestCertificateOutput(TypedDict):
    # String that contains the ARN of the issued certificate. This must be of the
    # form:
    # arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
    CertificateArn: str

    # Metadata pertaining to the operation's result.
    ResultMetadata: ResponseMetadata


class Certificate(NamedTuple):
    DomainName: str
    SubjectAlternativeNames: List[str]
    CertUUID: str
    TaskToken: str
    JobToken: str
    TaskType: str


class CertificateMetadata(TypedDict):
    domainName: str
    sanList: List[str]
    certUUid: str
    certArn: str
    taskToken: str
    taskType: str
    taskStatus: str
    jobToken: str


class CommonCertOperationResult(NamedTuple):
    CertArn: str
    DnsValidationRecords: List[ResourceRecord]


# A key-value pair that identifies or specifies metadata about an ACM resource.
class Tag(TypedDict):
    # The key of the tag.
    #
    # This member is required.
    Key: str

    # The value of the tag.
    Value: str


class ListTagsForCertificateOutput(TypedDict):
    # The key-value pairs that define the applied tags.
    Tags: List[Tag]

    # Metadata pertaining to the operation's result.
    ResponseMetadata: ResponseMetadata


class ImportCertificateInput(TypedDict):
    # The certificate to import.
    #
    # This member is required.
    Certificate: bytes

    # The private key that matches the public key in the certificate.
    #
    # This member is required.
    PrivateKey: bytes

    # The Amazon Resource Name (ARN)
    # (https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html) of
    # an imported certificate to replace. To import a new certificate, omit this
    # field.
    CertificateArn: str

    # The PEM encoded certificate chain.
    CertificateChain: bytes

    # One or more resource tags to associate with the imported certificate. Note: You
    # cannot apply tags when reimporting a certificate.
    Tags: List[Tag]


class ImportCertificateOutput(TypedDict):
    # The Amazon Resource Name (ARN)
    # (https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html) of
    # the imported certificate.
    CertificateArn: str

    # Metadata pertaining to the operation's result.
    ResponseMetadata: ResponseMetadata


class NotificationInput(TypedDict):
    distributionDomainName: str
    distributionArn: str
    aliases: Any
