import { useTelegram } from '../hooks/useTelegram'

interface Model {
    id: string
    name: string
    emoji: string
}

interface ModelSelectorProps {
    models: Model[]
    selected: string
    onChange: (id: string) => void
}

export default function ModelSelector({ models, selected, onChange }: ModelSelectorProps) {
    const { hapticFeedback } = useTelegram()

    return (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {models.map((model) => (
                <button
                    key={model.id}
                    onClick={() => {
                        hapticFeedback('light')
                        onChange(model.id)
                    }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${selected === model.id
                            ? 'bg-accent-primary text-white shadow-glow-primary'
                            : 'bg-bg-card border border-accent-primary/20 text-txt-secondary hover:border-accent-primary/40'
                        }`}
                >
                    {model.emoji} {model.name}
                </button>
            ))}
        </div>
    )
}
