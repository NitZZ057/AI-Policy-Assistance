class AppError(Exception):
    def __init__(
        self,
        *,
        message: str,
        code: str,
        status_code: int = 500,
    ) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class UpstreamAIError(AppError):
    pass


class VectorStoreError(AppError):
    pass
