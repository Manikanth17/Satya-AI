import os
import secrets
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from app.schemas.chat import (
    ChatRequest,
    SupportingQuote,
    SyntheticChatResponse,
    SyntheticClaim,
    SyntheticEvidence,
)


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: Literal["satya-ai"]
    mode: Literal["scaffold"]


app = FastAPI(
    title="SATYA Internal AI Service",
    description="Informational assistance, not legal advice.",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


def require_internal_token(
    supplied_token: Annotated[
        str | None,
        Header(alias="X-Internal-Token"),
    ] = None,
) -> None:
    expected_token = os.environ.get("SATYA_INTERNAL_TOKEN")

    if not expected_token or len(expected_token) < 32:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "INTERNAL_AUTH_NOT_CONFIGURED",
                "message": "Internal service authentication is not configured.",
            },
        )

    if supplied_token is None or not secrets.compare_digest(
        supplied_token.encode("utf-8"),
        expected_token.encode("utf-8"),
    ):
        raise HTTPException(
            status_code=401,
            detail={
                "code": "UNAUTHORIZED",
                "message": "A valid internal service token is required.",
            },
        )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="satya-ai",
        mode="scaffold",
    )


@app.post(
    "/internal/chat",
    response_model=SyntheticChatResponse,
    dependencies=[Depends(require_internal_token)],
)
def synthetic_chat(request: ChatRequest) -> SyntheticChatResponse:
    if not request.question.strip():
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_QUESTION",
                "message": "The question must contain non-whitespace text.",
            },
        )

    paragraph_id = "synthetic-doc-001-p001-para001"
    fixture_text = (
        "In this synthetic test scenario, the example application "
        "fee is 10 test credits."
    )

    evidence = SyntheticEvidence(
        paragraph_id=paragraph_id,
        document_id="synthetic-doc-001",
        document_title="SYNTHETIC FIXTURE — Example Application",
        pdf_page_number=1,
        printed_page_label=None,
        original_paragraph_label=None,
        derived_locator="Extracted paragraph 1 on PDF page 1.",
        exact_text=fixture_text,
    )

    claim = SyntheticClaim(
        claim_id="synthetic-claim-001",
        text=fixture_text,
        supporting_quotes=[
            SupportingQuote(
                evidence_id=paragraph_id,
                quote=fixture_text,
            )
        ],
    )

    return SyntheticChatResponse(
        claims=[claim],
        evidence=[evidence],
    )