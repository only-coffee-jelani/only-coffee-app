import SwiftUI

/// AsyncImage with built-in caching and offline support
struct CachedAsyncImage<Content: View, Placeholder: View>: View {
    let url: URL?
    let content: (Image) -> Content
    let placeholder: () -> Placeholder

    @State private var image: UIImage?
    @State private var isLoading = false
    @State private var error: Error?

    init(
        url: URL?,
        @ViewBuilder content: @escaping (Image) -> Content,
        @ViewBuilder placeholder: @escaping () -> Placeholder
    ) {
        self.url = url
        self.content = content
        self.placeholder = placeholder
    }

    var body: some View {
        Group {
            if let image = image {
                content(Image(uiImage: image))
            } else if isLoading {
                placeholder()
            } else if error != nil {
                placeholder()
            } else {
                placeholder()
            }
        }
        .onAppear {
            loadImage()
        }
    }

    private func loadImage() {
        guard let url = url else { return }

        isLoading = true
        ImageCacheManager.shared.getImage(from: url) { result in
            isLoading = false

            switch result {
            case .success(let loadedImage):
                image = loadedImage
            case .failure(let err):
                error = err
            }
        }
    }
}

// Convenience initializer for simple cases
extension CachedAsyncImage where Content == Image, Placeholder == Color {
    init(url: URL?) {
        self.init(
            url: url,
            content: { image in image },
            placeholder: { Color.gray.opacity(0.2) }
        )
    }
}

// Convenience initializer with custom placeholder
extension CachedAsyncImage where Placeholder == AnyView {
    init<P: View>(
        url: URL?,
        @ViewBuilder content: @escaping (Image) -> Content,
        @ViewBuilder placeholder: @escaping () -> P
    ) {
        self.init(
            url: url,
            content: content,
            placeholder: { AnyView(placeholder()) }
        )
    }
}
