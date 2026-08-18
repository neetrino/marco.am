import unittest

from openpyxl import Workbook

from scripts.convert_marco_xlsx_for_import import normalize_cell


class NormalizeCellTest(unittest.TestCase):
    def test_preserves_leading_zero_number_format(self) -> None:
        workbook = Workbook()
        cell = workbook.active["A1"]
        cell.value = 9468
        cell.number_format = "00000"

        self.assertEqual(normalize_cell(cell), "09468")

    def test_preserves_text_sku(self) -> None:
        workbook = Workbook()
        cell = workbook.active["A1"]
        cell.value = "09468"

        self.assertEqual(normalize_cell(cell), "09468")


if __name__ == "__main__":
    unittest.main()
