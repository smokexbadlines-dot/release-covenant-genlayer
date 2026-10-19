"""Direct-mode protocol tests. Live validator agreement still needs network proof."""
import json
from datetime import datetime, timezone, timedelta

import pytest


BASE = datetime(2026, 10, 20, 12, tzinfo=timezone.utc)
FIRST = int((BASE + timedelta(days=1)).timestamp())
REVISION = int((BASE + timedelta(days=2)).timestamp())
FINAL = int((BASE + timedelta(days=3)).timestamp())
SHA_A = "a" * 40
SHA_B = "b" * 40
SHA_C = "c" * 40
PROMISE = "The public CSV export remains available to existing users."
BASE_QUOTE = "The public CSV export remains available to existing users."
BREAK_QUOTE = "The public CSV export has been removed from this release."
REPAIR_QUOTE = "The public CSV export remains available in this release."


def warp(vm, days=0):
    vm.warp((BASE + timedelta(days=days)).isoformat())


def deploy(vm, direct_deploy):
    warp(vm)
    contract = direct_deploy(
        "contracts/release_covenant.py", "example/release-covenant",
        SHA_A, SHA_B, FIRST, REVISION, FINAL,
    )
    contract.add_promise(PROMISE, "docs/api.md", BASE_QUOTE)
    contract.add_promise("The legacy JSON endpoint stays available to existing clients.", "docs/json.md", "The legacy JSON endpoint stays available to existing clients.")
    contract.seal()
    return contract


def evidence(vm, release_sha=SHA_B, release_quote=BREAK_QUOTE, verdict="BREAK"):
    vm.clear_mocks()
    vm.mock_web(r".*/" + SHA_A + r"/docs/api\.md", {"status": 200, "body": BASE_QUOTE})
    vm.mock_web(r".*/" + release_sha + r"/docs/api\.md", {"status": 200, "body": release_quote})
    vm.mock_llm(r"You are checking one documented software compatibility promise", json.dumps({"verdict": verdict}))


def snapshot(contract):
    return json.loads(contract.get_snapshot())


def test_valid_objection_is_carried_and_repaired_at_new_commit(direct_vm, direct_deploy, direct_alice):
    contract = deploy(direct_vm, direct_deploy)
    assert snapshot(contract)["maintainer"].startswith("0x")
    evidence(direct_vm)
    with direct_vm.prank(direct_alice):
        assert contract.challenge(0, "docs/api.md", BREAK_QUOTE) == "BREAK"
    assert direct_vm.run_validator() is True
    assert [item["state"] for item in snapshot(contract)["promises"]] == ["OPEN", "CLEAN"]
    warp(direct_vm, 1.1)
    contract.revise(SHA_C)
    assert [item["state"] for item in snapshot(contract)["promises"]] == ["CARRIED", "CLEAN"]
    evidence(direct_vm, SHA_C, REPAIR_QUOTE, "REPAIRED")
    with direct_vm.prank(direct_alice):
        assert contract.verify_repair(0, "docs/api.md", REPAIR_QUOTE) == "REPAIRED"
    assert direct_vm.run_validator() is True
    assert snapshot(contract)["promises"][0]["state"] == "REPAIRED"
    warp(direct_vm, 3.1)
    assert contract.settle() == "PAY"


def test_timeout_refunds_only_sponsors_and_rejects_replay(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy(direct_vm, direct_deploy)
    direct_vm.value = 100
    with direct_vm.prank(direct_alice):
        contract.sponsor()
    direct_vm.value = 250
    with direct_vm.prank(direct_bob):
        contract.sponsor()
    direct_vm.value = 0
    evidence(direct_vm)
    with direct_vm.prank(direct_alice):
        contract.challenge(0, "docs/api.md", BREAK_QUOTE)
        with direct_vm.expect_revert("open challenge"):
            contract.challenge(0, "docs/api.md", BREAK_QUOTE)
    warp(direct_vm, 2.1)
    assert contract.settle() == "REFUND"
    with direct_vm.prank(direct_alice):
        contract.claim_refund()
        with direct_vm.expect_revert("no refund"):
            contract.claim_refund()
    with direct_vm.prank(direct_bob):
        contract.claim_refund()
    assert json.loads(contract.get_account("0x" + direct_alice.hex()))["claimable_wei"] == "100"
    assert json.loads(contract.get_account("0x" + direct_bob.hex()))["claimable_wei"] == "250"
    assert snapshot(contract)["total_sponsored_wei"] == "350"


def test_unauthorized_revision_and_missing_quote_fail_closed(direct_vm, direct_deploy, direct_alice):
    contract = deploy(direct_vm, direct_deploy)
    evidence(direct_vm)
    with direct_vm.prank(direct_alice):
        assert contract.challenge(0, "docs/api.md", "This quote is absent from the release file.") == "INSUFFICIENT"
    assert snapshot(contract)["promises"][0]["state"] == "CLEAN"
    with direct_vm.prank(direct_alice):
        contract.challenge(0, "docs/api.md", BREAK_QUOTE)
    warp(direct_vm, 1.1)
    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("maintainer only"):
            contract.revise(SHA_C)


def test_validator_rejects_forged_leader_verdict(direct_vm, direct_deploy, direct_alice):
    contract = deploy(direct_vm, direct_deploy)
    evidence(direct_vm)
    with direct_vm.prank(direct_alice):
        contract.challenge(0, "docs/api.md", BREAK_QUOTE)
    evidence(direct_vm, verdict="NO_BREAK")
    assert direct_vm.run_validator() is False


def test_repair_requires_positive_evidence_not_merely_no_break(direct_vm, direct_deploy, direct_alice):
    contract = deploy(direct_vm, direct_deploy)
    evidence(direct_vm)
    with direct_vm.prank(direct_alice):
        contract.challenge(0, "docs/api.md", BREAK_QUOTE)
    warp(direct_vm, 1.1)
    contract.revise(SHA_C)
    evidence(direct_vm, SHA_C, REPAIR_QUOTE, "NO_BREAK")
    with direct_vm.prank(direct_alice):
        assert contract.verify_repair(0, "docs/api.md", REPAIR_QUOTE) == "INSUFFICIENT"
    assert snapshot(contract)["promises"][0]["state"] == "CARRIED"
    warp(direct_vm, 3.1)
    assert contract.settle() == "REFUND"


def test_unavailable_source_and_late_sponsorship_are_recoverable(direct_vm, direct_deploy, direct_alice):
    contract = deploy(direct_vm, direct_deploy)
    direct_vm.mock_web(r".*/" + SHA_A + r"/docs/api\.md", {"status": 404, "body": ""})
    direct_vm.mock_web(r".*/" + SHA_B + r"/docs/api\.md", {"status": 200, "body": BREAK_QUOTE})
    with direct_vm.prank(direct_alice):
        assert contract.challenge(0, "docs/api.md", BREAK_QUOTE) == "INSUFFICIENT"
    assert snapshot(contract)["promises"][0]["state"] == "CLEAN"
    warp(direct_vm, 1.1)
    direct_vm.value = 12
    with direct_vm.prank(direct_alice):
        contract.sponsor()
    direct_vm.value = 0
    assert json.loads(contract.get_account("0x" + direct_alice.hex()))["claimable_wei"] == "12"
    assert snapshot(contract)["total_sponsored_wei"] == "0"
