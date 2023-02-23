from typing import List, TypedDict


class JobInfo(TypedDict):
    jobId: str
    job_input: str
    cert_total_number: int
    cloudfront_distribution_total_number: int
    cert_completed_number: int
    cloudfront_distribution_created_number: int
    jobType: str
    creationDate: str
    certCreateStageStatus: str
    certValidationStageStatus: str
    distStageStatus: str
    certList: List[str]
    distList: List[str]
    promptInfo: str
    dcv_validation_msg: str
