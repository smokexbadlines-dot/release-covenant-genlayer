# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

SHAS = (
    "848c5029ada0a8c13bf725c3421ddbd2633fb1eb",
    "ff07dc2722d1ea9c1fc780355fd39b329929570a",
    "11fbe9f174beff658efaa05c958257e69c147aa3",
)
QUOTES = (
    'requires-python = ">=3.10"',
    'requires-python = ">=3.11"',
    'requires-python = ">=3.10"',
)

class EvidenceProbe(gl.Contract):
    last_stage: u32
    last_result: str

    def __init__(self):
        self.last_stage = u32(0)
        self.last_result = "UNTESTED"

    @gl.public.write
    def check(self, stage: u32) -> str:
        index = int(stage)
        if index < 0 or index >= 3:
            raise gl.vm.UserError("unknown fixture stage")
        url = (
            "https://raw.githubusercontent.com/facelessuser/pymdown-extensions/"
            + SHAS[index]
            + "/pyproject.toml"
        )
        quote = QUOTES[index]

        def fetch() -> str:
            try:
                response = gl.nondet.web.get(url)
                if response.status != 200 or response.body is None:
                    return "HTTP_ERROR"
                if not (0 < len(response.body) <= 24000):
                    return "SIZE_ERROR"
                source = response.body.decode("utf-8")
                return "FOUND" if quote in source else "MISSING"
            except Exception:
                return "FETCH_ERROR"

        def validate(leader_result) -> bool:
            return (
                isinstance(leader_result, gl.vm.Return)
                and leader_result.calldata in (
                    "FOUND", "MISSING", "HTTP_ERROR", "SIZE_ERROR", "FETCH_ERROR"
                )
                and fetch() == leader_result.calldata
            )

        result = gl.vm.run_nondet_unsafe(fetch, validate)
        self.last_stage = stage
        self.last_result = result
        return result

    @gl.public.view
    def get_last(self) -> str:
        return f"{int(self.last_stage)}:{self.last_result}"
