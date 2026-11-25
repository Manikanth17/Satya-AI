from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ContractModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=False,
    )


class ChatRequest(ContractModel):
    question: str = Field(min_length=1, max_length=2000)


class SupportingQuote(ContractModel):
    evidence_id: str = Field(min_length=1)
    quote: str = Field(min_length=1)


class SyntheticClaim(ContractModel):
    claim_id: str = Field(min_length=1)
    text: str = Field(min_length=1)
    supporting_quotes: list[SupportingQuote] = Field(min_length=1)


class SyntheticEvidence(ContractModel):
    paragraph_id: str = Field(min_length=1)
    document_id: str = Field(min_length=1)
    corpus_revision: Literal["synthetic-v1"] = "synthetic-v1"

    document_title: str = Field(min_length=1)
    pdf_page_number: int = Field(ge=1)
    printed_page_label: str | None = None
    original_paragraph_label: str | None = None
    derived_locator: str = Field(min_length=1)

    exact_text: str = Field(min_length=1)
    official_source_url: None = None
    synthetic: Literal[True] = True


class SyntheticChatResponse(ContractModel):
    status: Literal["answered"] = "answered"
    mode: Literal["synthetic"] = "synthetic"
    corpus_revision: Literal["synthetic-v1"] = "synthetic-v1"

    evidence_label: Literal[
        "Supported by retrieved sources"
    ] = "Supported by retrieved sources"

    claims: list[SyntheticClaim] = Field(min_length=1)
    evidence: list[SyntheticEvidence] = Field(min_length=1)

    notice: Literal[
        "SYNTHETIC TEST DATA — not law or policy."
    ] = "SYNTHETIC TEST DATA — not law or policy."

    disclaimer: Literal[
        "Informational assistance, not legal advice."
    ] = "Informational assistance, not legal advice."