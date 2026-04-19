<?php

namespace App\Services;

use RuntimeException;
use Smalot\PdfParser\Parser;

class DocumentTextExtractor
{
    public function extract(string $path, string $mimeType): string
    {
        if ($mimeType === 'application/pdf') {
            if (! class_exists(Parser::class)) {
                throw new RuntimeException('PDF extraction requires smalot/pdfparser. Run composer install after dependencies are available.');
            }

            return trim((new Parser())->parseFile($path)->getText());
        }

        if (str_starts_with($mimeType, 'text/') || str_ends_with($path, '.txt')) {
            return trim(file_get_contents($path) ?: '');
        }

        throw new RuntimeException('Unsupported document type. Upload a PDF or text file.');
    }
}
