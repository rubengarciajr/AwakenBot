//! The colored orb shared by the native tray on every desktop platform.

pub fn icon() -> tauri::image::Image<'static> {
    tauri::include_image!("icons/64x64.png")
}

#[cfg(test)]
mod tests {
    use super::icon;
    use std::collections::BTreeSet;

    #[test]
    fn embedded_icon_has_complete_64px_rgba_pixels() {
        let image = icon();
        assert_eq!((image.width(), image.height()), (64, 64));
        assert_eq!(image.rgba().len(), 64 * 64 * 4);
    }

    #[test]
    fn orb_corners_are_fully_transparent() {
        let image = icon();
        for (x, y) in [(0, 0), (63, 0), (0, 63), (63, 63)] {
            assert_eq!(image.rgba()[(y * 64 + x) * 4 + 3], 0);
        }
    }

    #[test]
    fn orb_interior_is_visible_and_has_varied_colors() {
        let image = icon();
        let mut colors = BTreeSet::new();
        for y in 24..40 {
            for x in 24..40 {
                let offset = (y * 64 + x) * 4;
                let pixel = &image.rgba()[offset..offset + 4];
                assert!(pixel[3] >= 128, "the orb interior must remain visible");
                // AwakenBot: upstream per-pixel saturation check is dropped here. It held the
                // icon to the upstream pink-and-blue orb; AwakenBot's ice orb (brand/logo.png) has
                // near-white highlights. Visibility above and variety below still apply.
                colors.insert([pixel[0], pixel[1], pixel[2]]);
            }
        }
        assert!(colors.len() > 16, "the orb must not become a flat color");
    }
}
